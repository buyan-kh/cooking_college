# 🔐 User Authentication Implementation for Deepify

## Database Schema

Add these collections to your MongoDB database:

```javascript
// users collection
{
  _id: ObjectId,
  email: String,           // unique, indexed
  username: String,        // unique, indexed
  password_hash: String,   // bcrypt hashed password
  salt: String,            // random salt used for password hashing
  created_at: Date,
  last_login: Date,
  profile: {
    display_name: String,
    avatar_url: String,    // optional
    bio: String            // optional
  },
  settings: {
    email_notifications: Boolean,
    theme: String          // "light", "dark", "system"
  }
}

// user_sessions collection (for handling JWT refresh)
{
  _id: ObjectId,
  user_id: ObjectId,       // reference to users collection
  refresh_token: String,   // hashed token
  device_info: String,     // browser/device info
  ip_address: String,
  expires_at: Date,
  created_at: Date,
  last_used: Date
}
```

## Backend Implementation (FastAPI)

### 1. Add Required Dependencies

Add to your `requirements.txt`:

```
python-jose[cryptography]  # For JWT tokens
passlib[bcrypt]            # For password hashing
python-multipart           # For form data parsing
```

### 2. Create Auth-related Models

```python
# In models.py or directly in main.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    username: str
    email: EmailStr
    profile: dict
    settings: dict
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
```

### 3. Set Up Auth Utilities

```python
# In auth.py or directly in main.py
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import secrets
from fastapi.security import OAuth2PasswordBearer

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    refresh_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    # Store refresh token hash in database
    return refresh_token

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception

    # Convert ObjectId to string for the response
    user["_id"] = str(user["_id"])
    return user
```

### 4. Add Auth Endpoints

```python
# In main.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

@app.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    # Check if email already exists
    if await db.users.find_one({"email": user_data.email}):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Check if username already exists
    if await db.users.find_one({"username": user_data.username}):
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = {
        "email": user_data.email,
        "username": user_data.username,
        "password_hash": hashed_password,
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow(),
        "profile": {
            "display_name": user_data.username,
            "avatar_url": None,
            "bio": None
        },
        "settings": {
            "email_notifications": True,
            "theme": "system"
        }
    }

    result = await db.users.insert_one(new_user)
    new_user["_id"] = str(result.inserted_id)

    return new_user

@app.post("/token", response_model=TokenResponse)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login time
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )

    # Create tokens
    access_token_data = {
        "sub": str(user["_id"]),
        "type": "access"
    }
    refresh_token_data = {
        "sub": str(user["_id"]),
        "type": "refresh"
    }

    access_token = create_access_token(access_token_data)
    refresh_token = create_refresh_token(refresh_token_data)

    # Store refresh token
    await db.user_sessions.insert_one({
        "user_id": user["_id"],
        "refresh_token": get_password_hash(refresh_token),  # Store hashed version
        "device_info": "Web Browser",  # You can extract from request headers
        "ip_address": "0.0.0.0",  # You can extract from request
        "expires_at": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "created_at": datetime.utcnow(),
        "last_used": datetime.utcnow()
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@app.post("/token/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str = Body(..., embed=True)):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid token")

        # Check if token exists in database (implementation detail)
        # This is a simplified check - in production you'd verify the hashed token
        token_exists = await db.user_sessions.find_one({
            "user_id": ObjectId(user_id),
            "expires_at": {"$gt": datetime.utcnow()}
        })

        if not token_exists:
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        # Create new tokens
        access_token_data = {
            "sub": user_id,
            "type": "access"
        }
        new_refresh_token_data = {
            "sub": user_id,
            "type": "refresh"
        }

        new_access_token = create_access_token(access_token_data)
        new_refresh_token = create_refresh_token(new_refresh_token_data)

        # Update refresh token in database
        await db.user_sessions.update_one(
            {"_id": token_exists["_id"]},
            {
                "$set": {
                    "refresh_token": get_password_hash(new_refresh_token),
                    "expires_at": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
                    "last_used": datetime.utcnow()
                }
            }
        )

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }

    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user = Depends(get_current_user)):
    return current_user

@app.post("/logout")
async def logout(refresh_token: str = Body(..., embed=True), current_user = Depends(get_current_user)):
    # Delete the refresh token from the database
    try:
        await db.user_sessions.delete_one({
            "user_id": ObjectId(current_user["_id"]),
            # In production, you would need to verify the hashed refresh token
        })
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")
```

## Frontend Implementation (Next.js)

### 1. Create Auth Context

```typescript
// lib/auth-context.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/router";

type User = {
  _id: string;
  username: string;
  email: string;
  profile: {
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
  };
  settings: {
    email_notifications: boolean;
    theme: string;
  };
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token might be expired, try refreshing
          const refreshed = await refreshToken();
          if (!refreshed) {
            // If refresh failed, clear tokens
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);

    try {
      const response = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: email, // OAuth2 spec uses 'username' field
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      // Store tokens
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      // Fetch user profile
      const userResponse = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const userData = await userResponse.json();
      setUser(userData);

      router.push("/courses"); // Redirect to courses page after login
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed");
      }

      // Auto-login after registration
      await login(email, password);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;

    try {
      const response = await fetch("/api/token/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");

    try {
      if (refreshToken) {
        await fetch("/api/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

### 2. Create Auth API Routes

```typescript
// app/api/[...path]/route.ts (Next.js App Router)
import { NextRequest, NextResponse } from "next/server";

// This is a proxy to forward auth requests to your backend
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const body = await request.json();

  const response = await fetch(`${process.env.API_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const token = request.headers.get("Authorization");

  const response = await fetch(`${process.env.API_URL}/${path}`, {
    headers: {
      Authorization: token || "",
    },
  });

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
  });
}
```

### 3. Create Auth Pages

```tsx
// app/login/page.tsx
"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      // Redirect happens in the login function
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Log in to Deepify</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p>
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-500 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 4. Add Protection to Routes

```tsx
// components/ProtectedRoute.tsx
"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      !loading &&
      !user &&
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/register")
    ) {
      router.push("/login");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (
    !user &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/register")
  ) {
    return null; // Don't render children if not authenticated
  }

  return <>{children}</>;
}
```

### 5. Wrap Your App with Auth Provider

```tsx
// app/layout.tsx
import { AuthProvider } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ProtectedRoute>{children}</ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
```

## User-Course Relationship

To associate users with their courses, add these changes to your database schema:

1. Update the courses collection:

```javascript
// courses collection
{
  _id: ObjectId,
  user_id: ObjectId,       // Reference to the user who created this course
  title: String,
  description: String,
  created_at: Date,
  updated_at: Date,
  roadmap: Array,          // Your existing roadmap data
  // other course fields...
}
```

2. Update your API endpoints to filter by user:

```python
# Example: Get courses for the current user
@app.get("/courses/", response_model=List[CourseResponse])
async def get_user_courses(current_user = Depends(get_current_user)):
    cursor = db.courses.find({"user_id": ObjectId(current_user["_id"])})
    courses = await cursor.to_list(length=100)

    # Convert ObjectIds to strings for JSON response
    for course in courses:
        course["_id"] = str(course["_id"])

    return courses

# Update course creation to include user_id
@app.post("/courses/", response_model=CourseCreateResponse)
async def create_course(
    syllabus: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(...),
    current_user = Depends(get_current_user)
):
    # Your existing code, but add user_id to the course document
    course_doc = {
        "title": title,
        "description": description,
        "user_id": ObjectId(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "roadmap": roadmap
    }

    # Continue with your existing code...
```

## Security Considerations

1. **HTTPS**: Ensure all communication is over HTTPS
2. **Rate Limiting**: Implement rate limiting for login and registration endpoints
3. **Password Policies**: Enforce strong password rules (length, complexity)
4. **JWT Expiration**: Keep access tokens short-lived (30 mins) and refresh tokens longer (7 days)
5. **CORS**: Restrict CORS to your frontend domain in production
6. **Environment Variables**: Store sensitive values in environment variables
7. **Validation**: Validate all user inputs thoroughly
