import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { apiClient } from "../../config/axios";
import type { AdminQuestionResponseDTO } from "../../types/admin";

interface QuestionCreatorProps {
  examId?: number;
  onBack: () => void;
}

interface Topic {
  id: number;
  name: string;
}

interface ExamDetails {
  id: number;
  title: string;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  totalQuestions: number;
  isPublished: boolean;
}

type TabType = "existing" | "pool" | "manual" | "excel";

export function QuestionCreator({ examId, onBack }: QuestionCreatorProps) {
  // Tabs state
  const [activeTab, setActiveTab] = useState<TabType>(examId ? "pool" : "manual");

  // Form states (Manual Builder)
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

  // Excel Importer states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadReport, setUploadReport] = useState<any | null>(null);
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  // Shared state
  const [loading, setLoading] = useState(false);

  // Existing Questions tab states
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [pool, setPool] = useState<AdminQuestionResponseDTO[]>([]);
  const [questions, setQuestions] = useState<AdminQuestionResponseDTO[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTopic, setFilterTopic] = useState<string>("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [actionInProgress, setActionInProgress] = useState<{ [key: number]: boolean }>({});

  // Fetch initial configs if examId is provided
  useEffect(() => {
    if (examId) {
      fetchExamDetails();
      fetchExamPool();
      fetchTopics();
    }
  }, [examId]);

  // Fetch questions when filters or page changes
  useEffect(() => {
    if (examId && activeTab === "existing") {
      fetchQuestions();
    }
  }, [examId, activeTab, filterTopic, filterDifficulty, currentPage]);

  const fetchExamDetails = async () => {
    try {
      const response = await apiClient.get<ExamDetails[]>("/admin/exams");
      const currentExam = response.data.find((e) => e.id === examId);
      if (currentExam) {
        setExam(currentExam);
      }
    } catch (err) {
      console.error("Failed to fetch exam details", err);
    }
  };

  const fetchExamPool = async () => {
    try {
      const response = await apiClient.get<AdminQuestionResponseDTO[]>(`/admin/exams/${examId}/pool`);
      setPool(response.data);
    } catch (err) {
      console.error("Failed to fetch exam pool", err);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await apiClient.get<Topic[]>("/admin/topics");
      setTopics(response.data);
    } catch (err) {
      console.error("Failed to fetch topics", err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const params: any = {
        page: currentPage,
        size: 8,
      };
      if (filterDifficulty) params.difficulty = filterDifficulty;
      if (filterTopic) params.topicId = filterTopic;

      const response = await apiClient.get<any>("/admin/questions", { params });
      // Depending on whether it is page serialized directly or paged model:
      if (response.data.content) {
        setQuestions(response.data.content);
        setTotalPages(response.data.totalPages || 0);
      } else {
        setQuestions(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch questions", err);
    }
  };

  const handleAddToPool = async (questionId: number) => {
    setActionInProgress((prev) => ({ ...prev, [questionId]: true }));
    try {
      await apiClient.post(`/admin/exams/${examId}/questions`, null, {
        params: { questionId }
      });
      await fetchExamPool();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add question to pool");
    } finally {
      setActionInProgress((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleRemoveFromPool = async (questionId: number) => {
    setActionInProgress((prev) => ({ ...prev, [questionId]: true }));
    try {
      await apiClient.delete(`/admin/exams/${examId}/questions/${questionId}`);
      await fetchExamPool();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to remove question from pool");
    } finally {
      setActionInProgress((prev) => ({ ...prev, [questionId]: false }));
    }
  };

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
      correctAnswer: questionType === "SUBJECTIVE" ? null : (
        questionType === "TRUE_FALSE" ? (correctAnswer === "A" ? "TRUE" : "FALSE") : correctAnswer
      ),
      optionA: questionType === "MCQ" ? optionA : null,
      optionB: questionType === "MCQ" ? optionB : null,
      optionC: questionType === "MCQ" ? optionC : null,
      optionD: questionType === "MCQ" ? optionD : null,
    };

    try {
      setLoading(true);
      const response = await apiClient.post<{ id: number }>("/admin/questions", payload);
      const questionId = response.data.id;

      if (examId) {
        await apiClient.post(`/admin/exams/${examId}/questions`, null, {
          params: { questionId }
        });
        await fetchExamPool();
      }

      alert("Question created successfully!");
      setQuestionText("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create question.");
    } finally {
      setLoading(false);
    }
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalErrors([]);
    setUploadReport(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);

    if (file.name.toLowerCase().endsWith(".pdf")) {
      // PDF files skip local excel validation and are validated on the backend
      return;
    }

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
      if (examId) {
        await fetchExamPool();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Bulk upload failed on the server.");
    } finally {
      setLoading(false);
    }
  };

  // Target count helpers
  const countEasyInPool = pool.filter((q) => q.difficulty === "EASY").length;
  const countMediumInPool = pool.filter((q) => q.difficulty === "MEDIUM").length;
  const countHardInPool = pool.filter((q) => q.difficulty === "HARD").length;

  const targetEasy = exam?.easyCount || 0;
  const targetMedium = exam?.mediumCount || 0;
  const targetHard = exam?.hardCount || 0;

  const isEasySatisfied = countEasyInPool >= targetEasy;
  const isMediumSatisfied = countMediumInPool >= targetMedium;
  const isHardSatisfied = countHardInPool >= targetHard;

  const filteredQuestions = searchQuery
    ? questions.filter((q) => q.questionText.toLowerCase().includes(searchQuery.toLowerCase()))
    : questions;

  return (
    <div className="layout-container" style={{ height: "100%", overflowY: "auto", padding: "2rem 3rem", scrollBehavior: "smooth" }}>
      <header className="flat-header" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h1 className="flat-title" style={{ margin: 0 }}>
            Question Pool Settings {exam && `— ${exam.title}`}
          </h1>
          <button onClick={onBack} className="btn btn-secondary" style={{ margin: 0 }}>
            Back to Exams
          </button>
        </div>
        <p className="flat-subtitle" style={{ margin: 0, marginTop: "0.5rem" }}>
          Configure the selection criteria and question list for the examination.
        </p>
      </header>

      {/* Tabs Menu */}
      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "2rem", paddingBottom: "0.5rem" }}>
        {examId && (
          <button
            onClick={() => setActiveTab("pool")}
            style={{
              padding: "0.5rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "pool" ? "2px solid var(--accent-primary)" : "none",
              color: activeTab === "pool" ? "var(--accent-primary)" : "var(--fg-secondary)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Current Pool ({pool.length})
          </button>
        )}
        {examId && (
          <button
            onClick={() => setActiveTab("existing")}
            style={{
              padding: "0.5rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "existing" ? "2px solid var(--accent-primary)" : "none",
              color: activeTab === "existing" ? "var(--accent-primary)" : "var(--fg-secondary)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add Existing Questions
          </button>
        )}
        <button
          onClick={() => setActiveTab("manual")}
          style={{
            padding: "0.5rem 1rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "manual" ? "2px solid var(--accent-primary)" : "none",
            color: activeTab === "manual" ? "var(--accent-primary)" : "var(--fg-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Manual Question Builder
        </button>
        <button
          onClick={() => setActiveTab("excel")}
          style={{
            padding: "0.5rem 1rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "excel" ? "2px solid var(--accent-primary)" : "none",
            color: activeTab === "excel" ? "var(--accent-primary)" : "var(--fg-secondary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Bulk Importer (Excel/PDF)
        </button>
      </div>

      {/* Targets Progress Panel (Only visible if examId is provided) */}
      {examId && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
            marginBottom: "2.5rem",
            padding: "1.5rem",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "6px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {/* Easy Target Card */}
          <div style={{ padding: "1rem", borderRadius: "4px", backgroundColor: "var(--bg-primary)", borderLeft: `4px solid ${isEasySatisfied ? "var(--state-success)" : "var(--fg-secondary)"}` }}>
            <span style={{ fontSize: "0.8rem", color: "var(--fg-secondary)", textTransform: "uppercase" }}>EASY TARGET</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.5rem 0" }}>
              {countEasyInPool} / {targetEasy}
            </div>
            <span style={{ fontSize: "0.8rem", color: isEasySatisfied ? "var(--state-success)" : "var(--state-warning)" }}>
              {isEasySatisfied ? "Target Achieved ✓" : `Needs ${targetEasy - countEasyInPool} more`}
            </span>
          </div>

          {/* Medium Target Card */}
          <div style={{ padding: "1rem", borderRadius: "4px", backgroundColor: "var(--bg-primary)", borderLeft: `4px solid ${isMediumSatisfied ? "var(--state-success)" : "var(--fg-secondary)"}` }}>
            <span style={{ fontSize: "0.8rem", color: "var(--fg-secondary)", textTransform: "uppercase" }}>MEDIUM TARGET</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.5rem 0" }}>
              {countMediumInPool} / {targetMedium}
            </div>
            <span style={{ fontSize: "0.8rem", color: isMediumSatisfied ? "var(--state-success)" : "var(--state-warning)" }}>
              {isMediumSatisfied ? "Target Achieved ✓" : `Needs ${targetMedium - countMediumInPool} more`}
            </span>
          </div>

          {/* Hard Target Card */}
          <div style={{ padding: "1rem", borderRadius: "4px", backgroundColor: "var(--bg-primary)", borderLeft: `4px solid ${isHardSatisfied ? "var(--state-success)" : "var(--fg-secondary)"}` }}>
            <span style={{ fontSize: "0.8rem", color: "var(--fg-secondary)", textTransform: "uppercase" }}>HARD TARGET</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.5rem 0" }}>
              {countHardInPool} / {targetHard}
            </div>
            <span style={{ fontSize: "0.8rem", color: isHardSatisfied ? "var(--state-success)" : "var(--state-warning)" }}>
              {isHardSatisfied ? "Target Achieved ✓" : `Needs ${targetHard - countHardInPool} more`}
            </span>
          </div>
        </div>
      )}

      {/* Tab Render: Existing Questions */}
      {activeTab === "existing" && (
        <div>
          {/* Search/Filter Bar */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search by text content..."
              className="form-input"
              style={{ flex: 1.5, minWidth: "200px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="form-input"
              style={{ flex: 1 }}
              value={filterTopic}
              onChange={(e) => {
                setFilterTopic(e.target.value);
                setCurrentPage(0);
              }}
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id.toString()}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              className="form-input"
              style={{ flex: 1 }}
              value={filterDifficulty}
              onChange={(e) => {
                setFilterDifficulty(e.target.value);
                setCurrentPage(0);
              }}
            >
              <option value="">All Difficulties</option>
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
            </select>
          </div>

          {/* List Cards */}
          <div className="flex flex-col gap-4 mb-6">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12 text-[#5B6472] bg-white border border-dashed border-[#E2E5EA] rounded-xl font-medium">
                No matching questions found in the bank. Create new ones or clear filters.
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const isInPool = pool.some((p) => p.id === q.id);
                return (
                  <div 
                    key={q.id} 
                    className="bg-white border border-[#E2E5EA] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[#6C4FD6]/30 hover:shadow-md"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-[#5B6472] mb-1.5 uppercase tracking-wider">
                        Topic: {q.topicName || "General"}
                      </div>
                      <h4 className="font-bold text-[#0F1B2E] text-sm leading-relaxed mb-3">
                        {q.questionText}
                      </h4>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          q.difficulty === "EASY"
                            ? "bg-green-50 text-[#10B981] border border-[#10B981]/20"
                            : q.difficulty === "MEDIUM"
                            ? "bg-amber-50 text-[#F59E0B] border border-[#F59E0B]/20"
                            : "bg-red-50 text-[#EF4444] border border-[#EF4444]/20"
                        }`}>
                          {q.difficulty}
                        </span>
                        
                        {q.type === "MCQ" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF0FF] text-[#4A5FF7] border border-[#4A5FF7]/20">
                            Multiple Choice
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF2E2] text-[#E8A33D] border border-[#E8A33D]/20">
                            Subjective / Essay
                          </span>
                        )}

                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1EDFB] text-[#6C4FD6] border border-[#6C4FD6]/20">
                          {q.marks} Points
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0">
                      {isInPool ? (
                        <button
                          onClick={() => handleRemoveFromPool(q.id)}
                          className="px-3.5 py-1.5 border border-red-200 hover:bg-red-50 text-xs font-bold text-red-500 rounded-lg transition-colors"
                          disabled={actionInProgress[q.id]}
                        >
                          {actionInProgress[q.id] ? "Removing..." : "Remove"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToPool(q.id)}
                          className="px-3.5 py-1.5 text-white text-xs font-bold rounded-lg transition-colors"
                          style={{ backgroundColor: "#6C4FD6" }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5A3FB8"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#6C4FD6"}
                          disabled={actionInProgress[q.id] || (exam?.isPublished)}
                        >
                          {actionInProgress[q.id] ? "Adding..." : "Add to Pool"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                Page {currentPage + 1} of {totalPages}
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                  disabled={currentPage === 0}
                  className="btn btn-secondary"
                  style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))}
                  disabled={currentPage === totalPages - 1}
                  className="btn btn-secondary"
                  style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Render: Current Pool */}
      {activeTab === "pool" && (
        <div>
          <h2 className="text-lg font-bold text-[#0F1B2E] mb-6 pb-2 border-b border-[#E2E5EA]">
            Questions in this Examination Pool
          </h2>
          
          <div className="flex flex-col gap-4">
            {pool.length === 0 ? (
              <div className="text-center py-12 text-[#5B6472] bg-white border border-dashed border-[#E2E5EA] rounded-xl font-medium">
                No questions attached to this exam pool yet. Use the other tabs to add questions.
              </div>
            ) : (
              pool.map((q) => (
                <div 
                  key={q.id} 
                  className="bg-white border border-[#E2E5EA] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[#6C4FD6]/30 hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-[#5B6472] mb-1.5 uppercase tracking-wider">
                      Topic: {q.topicName || "General"}
                    </div>
                    <h4 className="font-bold text-[#0F1B2E] text-sm leading-relaxed mb-3">
                      {q.questionText}
                    </h4>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.difficulty === "EASY"
                          ? "bg-green-50 text-[#10B981] border border-[#10B981]/20"
                          : q.difficulty === "MEDIUM"
                          ? "bg-amber-50 text-[#F59E0B] border border-[#F59E0B]/20"
                          : "bg-red-50 text-[#EF4444] border border-[#EF4444]/20"
                      }`}>
                        {q.difficulty}
                      </span>
                      
                      {q.type === "MCQ" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF0FF] text-[#4A5FF7] border border-[#4A5FF7]/20">
                          Multiple Choice
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF2E2] text-[#E8A33D] border border-[#E8A33D]/20">
                          Subjective / Essay
                        </span>
                      )}

                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1EDFB] text-[#6C4FD6] border border-[#6C4FD6]/20">
                        {q.marks} Points
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0">
                    <button
                      onClick={() => handleRemoveFromPool(q.id)}
                      className="px-3.5 py-1.5 border border-red-200 hover:bg-red-50 text-xs font-bold text-red-500 rounded-lg transition-colors"
                      disabled={actionInProgress[q.id] || exam?.isPublished}
                    >
                      {actionInProgress[q.id] ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab Render: Manual Builder */}
      {activeTab === "manual" && (
        <div style={{ maxWidth: "700px", backgroundColor: "var(--bg-secondary)", padding: "2rem", borderRadius: "4px", margin: "0 auto", border: "1px solid var(--border-subtle)" }}>
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

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }} disabled={loading}>
              {loading ? "Adding Question..." : "Add Question to Pool"}
            </button>
          </form>
        </div>
      )}

      {/* Tab Render: Excel Importer */}
      {activeTab === "excel" && (
        <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "var(--bg-secondary)", padding: "2rem", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.5rem", textAlign: "center" }}>Bulk Importer (Excel/PDF)</h2>
          
          <div style={{ border: "2px dashed var(--border-subtle)", padding: "3rem", textAlign: "center", borderRadius: "4px", backgroundColor: "var(--bg-primary)", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--fg-secondary)", marginBottom: "1.5rem" }}>
              Select a spreadsheet (.xlsx) or document (.pdf) containing exam questions.
            </p>
            <input type="file" accept=".xlsx,.pdf" onChange={handleExcelChange} style={{ fontSize: "0.9rem", display: "inline-block" }} />
          </div>

          {localErrors.length > 0 && (
            <div style={{ marginTop: "1.5rem", padding: "1.5rem", backgroundColor: "#fff1f2", border: "1px solid #ffe4e6", borderRadius: "4px" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--state-danger)", marginBottom: "0.5rem" }}>
                Spreadsheet Warnings Found ({localErrors.length})
              </h3>
              <ul style={{ paddingLeft: "1.25rem", fontSize: "0.8rem", color: "var(--state-danger)" }}>
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
            <div style={{ marginTop: "1.5rem", padding: "1.5rem", backgroundColor: "var(--accent-light)", border: "1px solid var(--accent-primary)", borderRadius: "4px" }}>
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
      )}
    </div>
  );
}
