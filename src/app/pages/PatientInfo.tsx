import { useState } from "react";
import { useNavigate } from "react-router";
import { User, Calendar, ArrowRight, ArrowLeft } from "lucide-react";

export function PatientInfo() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    dateOfBirth: "",
    testDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Store patient info in sessionStorage
    sessionStorage.setItem("patientInfo", JSON.stringify(formData));
    navigate("/instructions");
  };

  const isValid =
    formData.name.trim() !== "" &&
    formData.age !== "" &&
    parseInt(formData.age) >= 65;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <User className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Participant Information
          </h1>
          <p className="text-xl text-gray-600">
            Please provide the following details to begin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-xl font-semibold text-gray-700 mb-3"
            >
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder="Enter participant's full name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="age"
              className="block text-xl font-semibold text-gray-700 mb-3"
            >
              Age *
            </label>
            <input
              type="number"
              id="age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder="Must be 65 or older"
              min="65"
              max="120"
              required
            />
            {formData.age !== "" && parseInt(formData.age) < 65 && (
              <p className="mt-2 text-lg text-red-600 font-medium">
                This assessment is designed for individuals aged 65 and older.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="dob"
              className="block text-xl font-semibold text-gray-700 mb-3"
            >
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              id="dob"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
              }
              className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="testDate"
              className="block text-xl font-semibold text-gray-700 mb-3"
            >
              <Calendar className="inline w-6 h-6 mr-2" />
              Assessment Date
            </label>
            <input
              type="date"
              id="testDate"
              value={formData.testDate}
              onChange={(e) =>
                setFormData({ ...formData, testDate: e.target.value })
              }
              className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xl py-5 px-6 rounded-xl flex items-center justify-center transition-all"
            >
              <ArrowLeft className="mr-2 w-6 h-6" />
              Back
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`flex-1 font-bold text-xl py-5 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                isValid
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continue
              <ArrowRight className="ml-2 w-6 h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
