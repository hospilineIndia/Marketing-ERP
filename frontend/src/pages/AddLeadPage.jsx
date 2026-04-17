import { Camera, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AddLeadPage() {
  return (
    <div className="space-y-4">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <Badge className="w-fit rounded-full bg-white/15 text-white hover:bg-white/15">
            Quick Capture
          </Badge>
          <CardTitle className="text-2xl">Add a lead on the move</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Placeholder flow for card upload, OCR autofill, notes, and GPS.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <Input placeholder="Lead name" className="h-12 rounded-2xl" />
          <Input placeholder="Phone number" className="h-12 rounded-2xl" />
          <Input placeholder="Company" className="h-12 rounded-2xl" />
          <Textarea
            placeholder="Meeting notes, requirements, or next steps"
            className="min-h-32 rounded-2xl"
          />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" className="h-12 rounded-2xl">
              <Camera className="mr-2 h-4 w-4" />
              Upload Card
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl">
              <MapPin className="mr-2 h-4 w-4" />
              Capture GPS
            </Button>
          </div>
          <Button className="h-12 w-full rounded-2xl">Save Lead</Button>
        </CardContent>
      </Card>
    </div>
  );
}
