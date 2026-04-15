"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";

interface Church {
  id: string;
  church_name: string;
  location: string;
  region: string;
}

interface FormData {
  email: string;
  fullName: string;
  password: string;
  phone: string;
  churchId: string;
  idFront: File | null;
  idBack: File | null;
  selfie: File | null;
}

type Step =
  | "basic_info"
  | "church_selection"
  | "documents"
  | "review"
  | "success";

export function PublicMemberRegistrationForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<Step>("basic_info");
  const [loading, setLoading] = useState(false);
  const [churches, setChurches] = useState<Church[]>([]);
  const [churchesLoading, setChurchesLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    userId: string;
    status: string;
  } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    fullName: "",
    password: "",
    phone: "",
    churchId: "",
    idFront: null,
    idBack: null,
    selfie: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch churches on mount
  useEffect(() => {
    fetchChurches();
  }, []);

  const fetchChurches = async () => {
    try {
      setChurchesLoading(true);
      const response = await fetch("/api/churches/list");
      const data = await response.json();

      if (data.churches) {
        setChurches(data.churches);
      }
    } catch (error) {
      console.error("Failed to fetch churches:", error);
      toast.error("Failed to load churches");
    } finally {
      setChurchesLoading(false);
    }
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) => {
    // Must have: uppercase letter, number, and special char (any non-alphanumeric)
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /\W/.test(password); // \W matches any non-word character
    return password.length >= 8 && hasUppercase && hasNumber && hasSpecialChar;
  };

  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === "basic_info") {
      if (!formData.email) newErrors.email = "Email is required";
      else if (!validateEmail(formData.email))
        newErrors.email = "Invalid email format";

      if (!formData.fullName) newErrors.fullName = "Full name is required";

      if (!formData.password) newErrors.password = "Password is required";
      else if (!validatePassword(formData.password))
        newErrors.password =
          "Password must be 8+ chars with uppercase, number, and special character";

      if (!formData.phone) newErrors.phone = "Phone is required";
    }

    if (currentStep === "church_selection") {
      if (!formData.churchId)
        newErrors.churchId = "Church selection is required";
    }

    if (currentStep === "documents") {
      if (!formData.idFront) newErrors.idFront = "ID front is required";
      if (!formData.idBack) newErrors.idBack = "ID back is required";
      if (!formData.selfie) newErrors.selfie = "Selfie is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setFormData({
      ...formData,
      [field]: file,
    });
  };

  const handleNextStep = () => {
    if (!validateStep(step)) return;

    const steps: Step[] = [
      "basic_info",
      "church_selection",
      "documents",
      "review",
      "success",
    ];
    const nextIndex = steps.indexOf(step) + 1;

    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handlePreviousStep = () => {
    const steps: Step[] = [
      "basic_info",
      "church_selection",
      "documents",
      "review",
      "success",
    ];
    const prevIndex = steps.indexOf(step) - 1;

    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep("review")) return;

    try {
      setLoading(true);

      const formDataObj = new FormData();
      formDataObj.append("email", formData.email);
      formDataObj.append("full_name", formData.fullName);
      formDataObj.append("password", formData.password);
      formDataObj.append("phone", formData.phone);
      formDataObj.append("church_id", formData.churchId);
      formDataObj.append("id_front_file", formData.idFront!);
      formDataObj.append("id_back_file", formData.idBack!);
      formDataObj.append("selfie_file", formData.selfie!);

      const response = await fetch("/api/auth/register-member", {
        method: "POST",
        body: formDataObj,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      setSuccessData({
        userId: data.user_id,
        status: data.status,
      });

      setStep("success");
      toast.success("Registration submitted successfully!");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to submit registration");
    } finally {
      setLoading(false);
    }
  };

  const selectedChurch = churches.find((c) => c.id === formData.churchId);

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { step: "basic_info", label: "Basic Info" },
            { step: "church_selection", label: "Church" },
            { step: "documents", label: "Documents" },
            { step: "review", label: "Review" },
            { step: "success", label: "Success" },
          ].map((s, idx) => (
            <div key={s.step} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  [
                    "basic_info",
                    "church_selection",
                    "documents",
                    "review",
                    "success",
                  ].indexOf(step) >= idx
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}>
                {idx + 1}
              </div>
              {idx < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    [
                      "basic_info",
                      "church_selection",
                      "documents",
                      "review",
                      "success",
                    ].indexOf(step) > idx
                      ? "bg-blue-600"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Basic Info Step */}
      {step === "basic_info" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Basic Information</h2>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={errors.email ? "border-red-500" : ""}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className={errors.fullName ? "border-red-500" : ""}
              placeholder="Your full name"
            />
            {errors.fullName && (
              <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className={errors.phone ? "border-red-500" : ""}
              placeholder="+251912345678"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className={errors.password ? "border-red-500" : ""}
              placeholder="Minimum 8 characters"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
            <p className="text-gray-500 text-sm mt-2">
              Must contain: uppercase, number, and special character
            </p>
          </div>
        </div>
      )}

      {/* Church Selection Step */}
      {step === "church_selection" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Select Your Church</h2>

          {churchesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : churches.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                No churches available. Please contact administrator.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {churches.map((church) => (
                <div
                  key={church.id}
                  onClick={() =>
                    setFormData({ ...formData, churchId: church.id })
                  }
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.churchId === church.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}>
                  <h3 className="font-semibold">{church.church_name}</h3>
                  <p className="text-sm text-gray-600">{church.location}</p>
                  <p className="text-sm text-gray-500">{church.region}</p>
                </div>
              ))}
            </div>
          )}

          {errors.churchId && (
            <p className="text-red-500 text-sm">{errors.churchId}</p>
          )}
        </div>
      )}

      {/* Documents Step */}
      {step === "documents" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Upload Documents</h2>

          <div>
            <Label>National ID - Front</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) =>
                  handleFileChange("idFront", e.target.files?.[0] || null)
                }
                className="hidden"
                id="idFront"
              />
              <label htmlFor="idFront" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">
                  JPG, PNG or PDF (max 5MB)
                </p>
              </label>
              {formData.idFront && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {formData.idFront.name}
                </p>
              )}
            </div>
            {errors.idFront && (
              <p className="text-red-500 text-sm mt-1">{errors.idFront}</p>
            )}
          </div>

          <div>
            <Label>National ID - Back</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) =>
                  handleFileChange("idBack", e.target.files?.[0] || null)
                }
                className="hidden"
                id="idBack"
              />
              <label htmlFor="idBack" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">
                  JPG, PNG or PDF (max 5MB)
                </p>
              </label>
              {formData.idBack && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {formData.idBack.name}
                </p>
              )}
            </div>
            {errors.idBack && (
              <p className="text-red-500 text-sm mt-1">{errors.idBack}</p>
            )}
          </div>

          <div>
            <Label>Selfie</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleFileChange("selfie", e.target.files?.[0] || null)
                }
                className="hidden"
                id="selfie"
              />
              <label htmlFor="selfie" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">JPG or PNG (max 5MB)</p>
              </label>
              {formData.selfie && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {formData.selfie.name}
                </p>
              )}
            </div>
            {errors.selfie && (
              <p className="text-red-500 text-sm mt-1">{errors.selfie}</p>
            )}
          </div>
        </div>
      )}

      {/* Review Step */}
      {step === "review" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Review Your Information</h2>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold">{formData.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-semibold">{formData.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-semibold">{formData.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Church</p>
              <p className="font-semibold">{selectedChurch?.church_name}</p>
            </div>
            <div className="pt-4 border-t space-y-2">
              <p className="text-sm text-gray-600">Documents</p>
              {formData.idFront && (
                <p className="text-sm flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                  ID Front
                </p>
              )}
              {formData.idBack && (
                <p className="text-sm flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                  ID Back
                </p>
              )}
              {formData.selfie && (
                <p className="text-sm flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                  Selfie
                </p>
              )}
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              By submitting, you confirm that all information is accurate and
              your documents are valid. Your registration will be reviewed by
              your church administrator.
            </p>
          </div>
        </div>
      )}

      {/* Success Step */}
      {step === "success" && successData && (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Registration Successful!</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left space-y-3">
            <p className="font-semibold text-green-900">What happens next?</p>
            <ul className="space-y-2 text-green-800 text-sm">
              <li>
                ✓ Your registration has been submitted to your church
                administrator
              </li>
              <li>✓ You will receive an email confirmation shortly</li>
              <li>✓ Your church administrator will review your documents</li>
              <li>✓ You will be notified when your registration is approved</li>
              <li>
                ✓ Once approved, you can access the dashboard and all member
                features
              </li>
            </ul>
          </div>
          <Button
            onClick={() => router.push("/auth/signin")}
            className="w-full">
            Continue to Login
          </Button>
        </div>
      )}

      {/* Navigation Buttons */}
      {step !== "success" && (
        <div className="flex gap-4 mt-8">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            disabled={step === "basic_info" || loading}>
            Previous
          </Button>
          {step === "review" ? (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Registration"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNextStep}
              disabled={loading}
              className="flex-1">
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
