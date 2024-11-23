"use client";

import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Loader2, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import html2pdf from "html2pdf.js"; // For PDF export

// Initialize the Gemini API
const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const ResumeBuilder = () => {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    linkedin: "",
    github: "",
    address: "",
    education: "",
    skills: "",
    projects: "",
    experience: "",
    achievements: "",
  });

  const [generatedResume, setGeneratedResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const buildResume = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Name and Email are required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userPrompt = `
        Build a professional resume based on the details below:
        Name: ${formData.name}
        Contact: ${formData.contact}
        Email: ${formData.email}
        LinkedIn: ${formData.linkedin}
        GitHub: ${formData.github}
        Address: ${formData.address}
        Education: ${formData.education}
        Skills: ${formData.skills}
        Projects: ${formData.projects}
        Experience: ${formData.experience}
        Achievements: ${formData.achievements}

        Format the resume with bold section headings (e.g., "Education", "Skills") 
        and ensure each section is properly separated for clarity.
      `;

      const result = await model.generateContent(userPrompt);
      const responseText = await result.response.text();
      setGeneratedResume(responseText.trim());
    } catch (err) {
      setError("Failed to build resume. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const convertToPDF = () => {
    const element = document.getElementById("resume-output");
    html2pdf()
      .set({
        filename: "Generated_Resume.pdf",
        margin: [10, 10],
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4" },
      })
      .from(element)
      .save();
  };

  const formatResume = (resumeText) => {
    return resumeText
      .split("\n")
      .map((line, index) =>
        line.match(/^(Summary|Education|Skills|Projects|Experience|Achievements|Contact):/i) ? (
          <p key={index} className="font-bold text-lg mt-4">{line}</p>
        ) : (
          <p key={index} className="text-gray-800">{line}</p>
        )
      );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
          <h1 className="text-3xl font-bold text-white text-center flex items-center justify-center gap-3">
            <Edit className="w-8 h-8" />
            Resume Builder
          </h1>
        </div>

        <div className="p-6 space-y-4">
          {Object.keys(formData).map((field) => (
            <div key={field}>
              <label
                className="block text-gray-700 font-semibold mb-1"
                htmlFor={field}
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <textarea
                id={field}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-indigo-300"
                placeholder={`Enter ${field}`}
                rows={field === "projects" || field === "experience" ? 4 : 2}
              ></textarea>
            </div>
          ))}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={buildResume}
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Building Resume...
              </div>
            ) : (
              "Generate Resume"
            )}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center gap-3"
              >
                <AlertTriangle className="w-6 h-6" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {generatedResume && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4"
            >
              <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Generated Resume
              </h2>
              <div id="resume-output" className="text-gray-800 leading-7">
                {formatResume(generatedResume)}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={convertToPDF}
                className="mt-4 w-full py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Download PDF
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResumeBuilder;





