import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoLogin = (event) => {
    event.preventDefault();

    login({
      token: "demo-token",
      user: {
        id: "demo-user",
        name: "Demo Field User",
        role: "field",
      },
    });

    navigate("/my-leads");
  };

  return (
    <div className="space-y-4">
      <Badge variant="secondary" className="rounded-full px-3 py-1">
        Login
      </Badge>
      <Card>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in to capture leads, upload cards, and add notes from the field.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDemoLogin} className="space-y-4">
            <Input type="email" placeholder="Work email" className="h-12 rounded-2xl" />
            <Input type="password" placeholder="Password" className="h-12 rounded-2xl" />
            <Button type="submit" className="h-12 w-full rounded-2xl">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
