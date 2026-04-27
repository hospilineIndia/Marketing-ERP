import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Phone, MapPin, Search, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createLead, createActivity, getLeadByPhone } from "@/services/api";

export function AddLeadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [phone, setPhone] = useState("");
  const [isExistingLead, setIsExistingLead] = useState(false);
  const [existingLead, setExistingLead] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    activity_type: "field",
    notes: "",
    call_outcome: "",
    duration_seconds: "",
    follow_up_required: false,
  });

  const debounceTimeout = useRef(null);
  const latestPhoneRef = useRef("");

  const handlePhonePrefill = async (phoneVal) => {
    try {
      setCheckingPhone(true);
      const res = await getLeadByPhone(phoneVal);

      if (res.exists) {
        setIsExistingLead(true);
        setExistingLead(res.lead);

        setFormData(prev => ({
          ...prev,
          name: "",
          company: ""
        }));
      }
    } catch (err) {
      console.error("Prefill lookup failed", err);
    } finally {
      setCheckingPhone(false);
    }
  };

  useEffect(() => {
    if (location.state?.phone) {
      const phoneVal = location.state.phone;

      setPhone(phoneVal);
      latestPhoneRef.current = phoneVal;

      handlePhonePrefill(phoneVal);
      
      // Clear location state so refresh doesn't trigger it again
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Phone input handler with debounced lookup
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setPhone(val);
    latestPhoneRef.current = val;
    
    // Reset existing lead state
    setIsExistingLead(false);
    setExistingLead(null);
    setError(null);
    setSuccess(false);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (val.length >= 10) {
      setCheckingPhone(true);
      debounceTimeout.current = setTimeout(async () => {
        if (latestPhoneRef.current !== val) return;
        try {
          const res = await getLeadByPhone(val);
          if (latestPhoneRef.current !== val) return;
          
          if (res.exists) {
            setIsExistingLead(true);
            setExistingLead(res.lead);
            setFormData(prev => ({
              ...prev,
              name: "",
              company: ""
            }));
          }
        } catch (err) {
          console.error("Phone lookup failed", err);
        } finally {
          if (latestPhoneRef.current === val) {
            setCheckingPhone(false);
          }
        }
      }, 500);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleActivityTypeSwitch = (type) => {
    setFormData((prev) => ({ ...prev, activity_type: type, call_outcome: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (phone.length < 10) {
      setError("Enter valid phone number");
      return;
    }

    if (formData.activity_type === "call" && !formData.call_outcome) {
      setError("Call outcome is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      if (isExistingLead) {
        await createActivity({
          lead_id: existingLead.id,
          activity_type: formData.activity_type,
          notes: formData.notes,
          call_outcome: formData.activity_type === "call" ? formData.call_outcome : undefined,
          duration_seconds: formData.activity_type === "call" && formData.duration_seconds 
            ? Number(formData.duration_seconds) 
            : undefined,
          follow_up_required: formData.follow_up_required,
        });
      } else {
        if (!formData.name) {
          setError("Name is required for new leads.");
          setLoading(false);
          return;
        }

        await createLead({
          name: formData.name,
          phone,
          company: formData.company,
          activity_type: formData.activity_type,
          notes: formData.notes,
        });
      }
      
      setSuccess(true);
      setPhone("");
      setFormData({
        name: "",
        company: "",
        activity_type: "field",
        notes: "",
        call_outcome: "",
        duration_seconds: "",
        follow_up_required: false,
      });
      setIsExistingLead(false);
      setExistingLead(null);
      
      setTimeout(() => {
        navigate("/my-leads");
      }, 1000);
    } catch (err) {
      console.error("Submission failed:", err);
      setError(err.response?.data?.error || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-32 overflow-x-hidden max-w-full">
      {/* Header */}
      <Card className="relative border-none bg-primary text-primary-foreground shadow-lg overflow-hidden">
        <CardHeader className="relative">
          <Badge className="w-fit rounded-full bg-white/20 text-white border-none mb-2">
            New Interaction
          </Badge>
          <CardTitle className="text-2xl font-black">Record Activity</CardTitle>
          <CardDescription className="text-primary-foreground/90 font-medium">
            Log a call or field visit seamlessly.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">
                {error}
              </div>
            )}
            
            {success && (
              <div className="rounded-xl bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-600 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-5 w-5" />
                Saved successfully
              </div>
            )}

            {/* 1. PRIMARY PHONE FIELD */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground pl-1">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  name="phone"
                  placeholder="Enter 10-digit phone"
                  className="h-12 pl-12 rounded-xl bg-muted/50 border-none focus-visible:ring-primary font-medium"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={12}
                  required
                />
                {checkingPhone && (
                  <Loader2 className="absolute right-4 top-3.5 h-5 w-5 animate-spin text-muted-foreground" />
                )}
                {!checkingPhone && phone.length >= 10 && (
                  <CheckCircle2 className="absolute right-4 top-3.5 h-5 w-5 text-emerald-500" />
                )}
              </div>
            </div>

            {/* 2. DYNAMIC MODE UI */}
            {isExistingLead && existingLead ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                  Existing Lead Found
                </div>
                <div className="text-sm text-emerald-700 font-medium ml-7">
                  {existingLead.name} {existingLead.company && `(${existingLead.company})`}
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <Input
                  name="name"
                  placeholder="Full Name *"
                  className="h-12 rounded-xl bg-muted/50 border-none focus-visible:ring-primary"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isExistingLead}
                />
                <Input
                  name="company"
                  placeholder="Company Name (Optional)"
                  className="h-12 rounded-xl bg-muted/50 border-none focus-visible:ring-primary"
                  value={formData.company}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="border-t border-dashed my-4"></div>

            {/* 3. ACTIVITY TOGGLE */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-foreground pl-1">Activity Type</label>
              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleActivityTypeSwitch("field")}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold transition-all ${
                    formData.activity_type === "field"
                      ? "bg-white shadow text-primary"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  Field Visit
                </button>
                <button
                  type="button"
                  onClick={() => handleActivityTypeSwitch("call")}
                  className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold transition-all ${
                    formData.activity_type === "call"
                      ? "bg-white shadow text-primary"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  Phone Call
                </button>
              </div>
            </div>

            {/* 4. CONDITIONAL FIELDS */}
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              {formData.activity_type === "call" && (
                <>
                  <select
                    name="call_outcome"
                    className="flex h-12 w-full rounded-xl border-none bg-muted/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.call_outcome}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Select Call Outcome</option>
                    <option value="Answered">Answered</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Interested">Interested</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>

                  <Input
                    name="duration_seconds"
                    type="number"
                    placeholder="Duration in seconds (Optional)"
                    className="h-12 rounded-xl bg-muted/50 border-none focus-visible:ring-primary"
                    value={formData.duration_seconds}
                    onChange={handleChange}
                  />
                </>
              )}

              <textarea
                name="notes"
                placeholder="Interaction notes (Optional)"
                className="flex w-full min-h-[100px] rounded-xl bg-muted/50 border-none px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
                value={formData.notes}
                onChange={handleChange}
              />

              <label className="flex items-center gap-3 p-3 rounded-xl border border-muted cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  name="follow_up_required"
                  checked={formData.follow_up_required}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-muted text-primary focus:ring-primary accent-primary"
                />
                <span className="text-sm font-bold text-foreground">Follow-up Required</span>
              </label>
            </div>

            {/* 5. SUBMIT */}
            <Button 
              type="submit" 
              className="h-14 w-full rounded-xl text-lg font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-6" 
              disabled={loading || checkingPhone}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : isExistingLead ? (
                "Add Activity"
              ) : (
                "Create Lead"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
