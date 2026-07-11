import React, { useState } from "react";
import * as XLSX from "xlsx";
import { apiClient } from "../../config/axios";

interface QuestionCreatorProps {
  examId?: number;
  onBack: () => void;
}

export function QuestionCreator({ examId, onBack }: QuestionCreatorProps) {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"MCQ" | "TRUE_FALSE" | "SUBJECTIVE">("MCQ");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("EASY");
  const [marks, setMarks] = useState(2);
  const [topicName, setTopicName] = useState("");
  
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadReport, setUploadReport] = useState<any | null>(null);
  const [localErrors, setLocalErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (questionType === "MCQ" && (!optionA || !optionB || !optionC || !optionD)) {
      alert("All options A-D must be specified for MCQ questions.");
      return;
    }

    const payload = {
      questionText,
      type: questionType,
      difficulty,
      marks,
      topicName,
      correctAnswer: questionType === "SUBJECTIVE" ? null : correctAnswer,
      options: questionType === "MCQ" ? { A: optionA, B: optionB, C: optionC, D: optionD } : null,
    };

    try {
      const response = await apiClient.post<{ id: number }>("/admin/questions", payload);
      const questionId = response.data.id;

      if (examId) {
        await apiClient.post(`/admin/exams/${examId}/questions`, null, {
          params: { questionId }
        });
      }

      alert("Question created successfully!");
      setQuestionText("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
    } catch (err) {
      console.error(err);
      alert("Failed to create question.");
    }
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalErrors([]);
    setUploadReport(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        const errors: string[] = [];
        rows.forEach((row, index) => {
          const rowNum = index + 2;
          
          if (!row.Topic || !row["Question Type"] || !row.Difficulty || row.Marks === undefined) {
            errors.push(`Row ${rowNum}: Missing mandatory columns (Topic, Question Type, Difficulty, Marks)`);
            return;
          }

          const qType = String(row["Question Type"]).toUpperCase();
          if (qType === "MCQ") {
            if (!row["Option A"] || !row["Option B"] || !row["Option C"] || !row["Option D"]) {
              errors.push(`Row ${rowNum}: MCQ type requires Option A, Option B, Option C, and Option D columns`);
            }
          }

          const diff = String(row.Difficulty).toUpperCase();
          if (diff !== "EASY" && diff !== "MEDIUM" && diff !== "HARD") {
            errors.push(`Row ${rowNum}: Invalid difficulty value '${row.Difficulty}'. Expected EASY, MEDIUM, or HARD`);
          }

          if (isNaN(parseInt(row.Marks))) {
            errors.push(`Row ${rowNum}: Marks must be a valid integer representation`);
          }
        });

        setLocalErrors(errors);
      } catch (err) {
        console.error("Local parsing failure", err);
        setLocalErrors(["Failed to parse spreadsheet locally. Verify it is a valid Excel file."]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkUpload = async () => {
    if (!excelFile) return;
    if (localErrors.length > 0) {
      alert("Please fix all local validation errors before uploading to the server.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", excelFile);

    try {
      const response = await apiClient.post("/admin/questions/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploadReport(response.data);
      alert("Bulk upload completed successfully.");
    } catch (err) {
      console.error(err);
      alert("Bulk upload failed on the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container">
      <header className="flat-header">
        <div>
          <h1 className="flat-title">Question Creation Portal</h1>
          <p className="flat-subtitle">Add single questions manually or upload spreadsheet batches</p>
        </div>
        <button onClick={onBack} className="btn btn-secondary">
          Back
        </button>
      </header>

      <div style={{ display: "flex", gap: "3rem", marginTop: "2rem" }}>
        
        <div style={{ flex: 1.1, backgroundColor: "var(--bg-secondary)", padding: "2rem", borderRadius: "4px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.5rem" }}>Manual Question Builder</h2>
          <form onSubmit={handleCreateQuestion}>
            
            <div className="form-group">
              <label className="form-label">Question Text</label>
              <textarea className="form-input" rows={4} value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Topic Name</label>
                <input type="text" className="form-input" value={topicName} onChange={(e) => setTopicName(e.target.value)} required placeholder="e.g. Database Systems" />
              </div>
              <div className="form-group">
                <label className="form-label">Question Type</label>
                <select className="form-input" value={questionType} onChange={(e) => setQuestionType(e.target.value as any)}>
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="SUBJECTIVE">Subjective Essay</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Difficulty Rating</label>
                <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Marks Value</label>
                <input type="number" className="form-input" value={marks} onChange={(e) => setMarks(parseInt(e.target.value))} required />
              </div>
            </div>

            {questionType === "MCQ" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem", padding: "1rem 0", borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Option A</label>
                    <input type="text" className="form-input" value={optionA} onChange={(e) => setOptionA(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Option B</label>
                    <input type="text" className="form-input" value={optionB} onChange={(e) => setOptionB(e.target.value)} required />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Option C</label>
                    <input type="text" className="form-input" value={optionC} onChange={(e) => setOptionC(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Option D</label>
                    <input type="text" className="form-input" value={optionD} onChange={(e) => setOptionD(e.target.value)} required />
                  </div>
                </div>
              </div>
            )}

            {questionType !== "SUBJECTIVE" && (
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Correct Option</label>
                <select className="form-input" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}>
                  <option value="A">{questionType === "TRUE_FALSE" ? "True (A)" : "Option A"}</option>
                  <option value="B">{questionType === "TRUE_FALSE" ? "False (B)" : "Option B"}</option>
                  {questionType === "MCQ" && (
                    <>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </>
                  )}
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
              Add Question to Pool
            </button>
          </form>
        </div>

        <div style={{ flex: 0.9 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.5rem" }}>Excel Bulk Importer</h2>
          
          <div style={{ border: "2px dashed var(--border-subtle)", padding: "2rem", textAlign: "center", borderRadius: "4px" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--fg-secondary)", marginBottom: "1rem" }}>
              Select a spreadsheet (.xlsx) containing exam questions.
            </p>
            <input type="file" accept=".xlsx" onChange={handleExcelChange} style={{ fontSize: "0.9rem" }} />
          </div>

          {localErrors.length > 0 && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#fff1f2", border: "1px solid #ffe4e6", borderRadius: "4px" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--state-danger)", marginBottom: "0.5rem" }}>
                Spreadsheet Warnings Found ({localErrors.length})
              </h3>
              <ul style={{ paddingLeft: "1.25rem", fontSize: "0.8rem", color: "var(--state-danger)", listStyleType: "none" }}>
                {localErrors.map((err, i) => (
                  <li key={i} style={{ marginBottom: "0.25rem" }}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {excelFile && localErrors.length === 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <button onClick={handleBulkUpload} className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Processing Upload..." : "Upload Questions to Server"}
              </button>
            </div>
          )}

          {uploadReport && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "var(--accent-light)", border: "1px solid var(--accent-primary)", borderRadius: "4px" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
                Upload Completed Successfully
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                Total rows parsed: {uploadReport.totalRows} <br />
                Successfully imported: {uploadReport.successCount}
              </p>
              {uploadReport.errors && uploadReport.errors.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Ignored items:</span>
                  <ul style={{ paddingLeft: "1.25rem", fontSize: "0.75rem", color: "var(--state-warning)" }}>
                    {uploadReport.errors.map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
