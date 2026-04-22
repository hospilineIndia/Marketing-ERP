import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MapPin, Loader2, User, Phone, Mail, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createLead } from "@/services/api";

export function AddLeadPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError("Name and Phone are required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createLead(formData);
      navigate("/my-leads");
    } catch (err) {
      console.error("Failed to create lead:", err);
      setError(err.response?.data?.error || "Failed to save lead. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Promotion Header */}
      <Card className="border-none bg-primary text-primary-foreground shadow-lg overflow-hidden">
        <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <CardHeader className="relative">
          <Badge className="w-fit rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-none mb-2">
            New Prospect
          </Badge>
          <CardTitle className="text-2xl font-black">Add Manual Lead</CardTitle>
          <CardDescription className="text-primary-foreground/90 font-medium">
            Enter lead details manually for quick registration.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Form */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  name="name"
                  placeholder="Full Name *"
                  className="h-12 pl-12 rounded-xl bg-muted/50 border-none focus-visible:ring-primary"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  name="phone"
                  placeholder="Phone Number *"
                  className="h-12 pl-12 rounded-xl bg-muted/50 border-none focus-visible:ring-primary"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email Address (Optional)"
                  className="h-12 pl-12 rounded-xl bg-muted/50 border-none focus-visible:ring-primary"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="relative">
                <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  name="company"
                  placeholder="Company Name (Optional)"
                  className="h-12 pl-12 rounded-xl bg-muted/50 border-none focus-visible:ring-primary"
                  value={formData.company}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Quick Actions (Placeholders) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button type="button" variant="secondary" className="h-12 rounded-xl font-bold bg-secondary/50">
                <Camera className="mr-2 h-4 w-4" />
                Scan Card
              </Button>
              <Button type="button" variant="outline" className="h-12 rounded-xl font-bold border-muted-foreground/20">
                <MapPin className="mr-2 h-4 w-4" />
                Tag GPS
              </Button>
            </div>

            <Button 
              type="submit" 
              className="h-14 w-full rounded-xl text-lg font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving Lead...
                </>
              ) : (
                "Save Lead"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
