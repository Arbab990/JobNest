"use client";

import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Tesseract from "tesseract.js";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";

const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const ResumeAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState({
    summary: "",
    rating: "",
    keyPoints: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Invalid file type! Please upload a PNG or JPG image.");
        setSelectedFile(null);
      } else {
        setError("");
        setSelectedFile(file);
      }
    }
  };

  const parseGeminiResponse = (responseText) => {
    try {
      const summaryMatch = responseText.match(/\*\*Summary:\*\*(.*?)(?=\*\*Key Points:\*\*)/s);
      const summary = summaryMatch 
        ? summaryMatch[1].trim().replace(/\n/g, ' ') 
        : "No summary available.";
  
      const keyPointsMatch = responseText.match(/\*\*Key Points:\*\*(.*?)(?=\*\*Rating:\*\*)/s);
      const keyPoints = keyPointsMatch 
        ? keyPointsMatch[1]
            .split(/\d\.\s*/)  
            .map(point => 
              point.replace(/^\*\*(.*?)\*\*/, '$1').trim()
            )
            .filter(point => point && point.length > 3)
        : ["No key points available"];
  
      const ratingMatch = responseText.match(/\*\*Rating:\*\*\s*(\w+)/);
      const rating = ratingMatch ? ratingMatch[1] : "Not Rated";

      return { summary, rating, keyPoints };
    } catch (err) {
      console.error("Parsing error:", err);
      return {
        summary: "Could not parse summary.",
        rating: "Not Rated",
        keyPoints: ["Parsing failed"]
      };
    }
  };

  const analyzeResume = async () => {
    if (!selectedFile) {
      setError("Please upload a resume image first!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ocrResult = await Tesseract.recognize(selectedFile, "eng", {
        logger: (info) => console.log(info),
      });

      const extractedText = ocrResult.data.text;
      console.log("Extracted Text:", extractedText);

      const userPrompt = `
        Resume Analysis:

        Summary: Provide a concise 2-3 sentence summary of the applicant's qualifications.

        Key Points: List 3 notable strengths or achievements from the resume.

        Rating: Evaluate the overall resume quality in one word (Excellent, Good, Average, Poor).

        Resume Text:
        ${extractedText}
      `;

      const result = await model.generateContent(userPrompt);
      const responseText = await result.response.text();
      console.log("Gemini API Full Response:", responseText);

      const parsedResult = parseGeminiResponse(responseText);
      
      setAnalysisResult(parsedResult);
    } catch (err) {
      console.error("Error analyzing resume:", err);
      setError("Failed to analyze resume. Please try again later.");
      setAnalysisResult({
        summary: "",
        rating: "",
        keyPoints: []
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
          <h1 className="text-3xl font-bold text-white text-center flex items-center justify-center gap-3">
            <FileText className="w-8 h-8" />
            Resume Analyzer
          </h1>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center w-full">
            <label 
              className={`
                flex flex-col items-center justify-center w-full h-48 border-2 border-dashed 
                rounded-lg cursor-pointer transition-all duration-300
                ${selectedFile 
                  ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }
              `}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 text-gray-500 mb-3" />
                <p className="mb-2 text-sm text-gray-500">
                  {selectedFile 
                    ? `Selected File: ${selectedFile.name}` 
                    : "Click to upload resume image"
                  }
                </p>
                <p className="text-xs text-gray-400">Only PNG or JPG (Max 5MB)</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={analyzeResume}
            disabled={loading || !selectedFile}
            className={`
              w-full py-3 rounded-lg text-white font-semibold transition-all duration-300
              ${loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
              }
              ${!selectedFile && 'opacity-50 cursor-not-allowed'}
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </div>
            ) : (
              "Analyze Resume"
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

          {(analysisResult.summary || analysisResult.rating || analysisResult.keyPoints.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4"
            >
              <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Analysis Result
              </h2>

              <div className="space-y-3">
                {analysisResult.summary && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Summary</h3>
                    <p className="text-gray-600">{analysisResult.summary}</p>
                  </div>
                )}

                {analysisResult.rating && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Resume Rating</h3>
                    <p className="text-gray-600">{analysisResult.rating}</p>
                  </div>
                )}

                {analysisResult.keyPoints.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Key Points</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      {analysisResult.keyPoints.map((point, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {point}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResumeAnalyzer;

