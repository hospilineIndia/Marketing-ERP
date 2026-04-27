import { LogOut, UserCircle2, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api, { handleLogout } from "@/services/api";

export function AccountPage() {
  const { user, logout } = useAuth();

  const onLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout API failed, forcing local logout", err);
    } finally {
      logout(); // Clear context
      handleLogout(); // Clear storage & redirect
    }
  };

  return (
    <div className="space-y-4 pb-32 overflow-x-hidden max-w-full">
      {/* Promotion Header */}
      <Card className="relative border-none bg-primary text-primary-foreground shadow-lg overflow-hidden">
        <CardHeader className="relative">
          <Badge className="w-fit rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-none mb-2">
            My Account
          </Badge>
          <CardTitle className="text-2xl font-black">Profile</CardTitle>
          <CardDescription className="text-primary-foreground/90 font-medium">
            Manage your account and session.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Info */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col items-center justify-center space-y-3 pb-4 border-b border-muted">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UserCircle2 className="h-12 w-12" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">{user?.name || "User"}</h2>
              <Badge variant="outline" className="mt-1 bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px] tracking-wider font-bold">
                {user?.role || "Field Agent"}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="h-5 w-5" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider">Email Address</span>
                <span className="text-sm font-medium text-foreground">{user?.email || "Not provided"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <ShieldCheck className="h-5 w-5" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider">Security</span>
                <span className="text-sm font-medium text-foreground">Active Session</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={onLogout} 
            variant="destructive" 
            className="w-full h-12 rounded-xl font-bold text-base mt-4 shadow-sm"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
