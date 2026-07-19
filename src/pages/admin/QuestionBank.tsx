import { useState, useEffect } from "react";
import { apiClient } from "../../config/axios";
import type { AdminQuestionResponseDTO } from "../../types/admin";

interface Topic {
  id: number;
  name: string;
}

interface QuestionBankProps {
  onBack: () => void;
}

export function QuestionBank({ onBack }: QuestionBankProps) {
  const [questions, setQuestions] = useState<AdminQuestionResponseDTO[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const fetchTopics = async () => {
    try {
      const response = await apiClient.get<Topic[]>("/admin/topics");
      setTopics(response.data);
    } catch (err) {
      console.error("Failed to load topics", err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        size: 10,
      };
      if (selectedTopicId) params.topicId = selectedTopicId;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (selectedType) params.type = selectedType;
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;

      const response = await apiClient.get<any>("/admin/questions", { params });
      setQuestions(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch question bank.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  // Debounce search input to prevent duplicate updates (Rule 4)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(0);
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchQuestions();
  }, [selectedTopicId, selectedDifficulty, selectedType, debouncedSearchQuery, page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await apiClient.delete(`/admin/questions/${id}`);
      alert("Question deleted successfully!");
      fetchQuestions();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Failed to delete question.";
      alert(errMsg);
    }
  };

  const truncate = (str: string, n: number) => {
    return str.length > n ? str.slice(0, n - 1) + "..." : str;
  };

  return (
    <div className="layout-container" style={{ height: "100%", overflowY: "auto", padding: "2rem 3rem", scrollBehavior: "smooth" }}>
      <header className="flat-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h1 className="flat-title" style={{ margin: 0 }}>Question Bank Explorer</h1>
          <button onClick={onBack} className="btn btn-secondary" style={{ margin: 0 }}>
            Back to Dashboard
          </button>
        </div>
        <p className="flat-subtitle" style={{ margin: 0, marginTop: "0.5rem" }}>
          Manage, search, and filter the global question repository
        </p>
      </header>

      {/* Search & Filters */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        gap: "1.5rem", 
        marginBottom: "2rem", 
        padding: "1.5rem", 
        backgroundColor: "var(--bg-secondary)", 
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)"
      }}>
        {/* Search Input Box */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--fg-secondary)" }}>Search Questions</label>
          <input
            type="text"
            className="form-input"
            placeholder="Type question keywords to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              padding: "0.6rem 1rem", 
              border: "1px solid var(--border-subtle)", 
              borderRadius: "8px", 
              backgroundColor: "var(--bg-primary)",
              color: "var(--fg-primary)",
              outline: "none"
            }}
          />
        </div>

        {/* Dropdowns Filters Row */}
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--fg-secondary)" }}>Filter by Topic</label>
            <select 
              value={selectedTopicId} 
              onChange={(e) => { setSelectedTopicId(e.target.value); setPage(0); }}
              style={{ 
                padding: "0.6rem 1rem", 
                border: "1px solid var(--border-subtle)", 
                borderRadius: "8px", 
                backgroundColor: "var(--bg-primary)",
                color: "var(--fg-primary)",
                outline: "none"
              }}
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--fg-secondary)" }}>Filter by Difficulty</label>
            <select 
              value={selectedDifficulty} 
              onChange={(e) => { setSelectedDifficulty(e.target.value); setPage(0); }}
              style={{ 
                padding: "0.6rem 1rem", 
                border: "1px solid var(--border-subtle)", 
                borderRadius: "8px", 
                backgroundColor: "var(--bg-primary)",
                color: "var(--fg-primary)",
                outline: "none"
              }}
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--fg-secondary)" }}>Filter by Type</label>
            <select 
              value={selectedType} 
              onChange={(e) => { setSelectedType(e.target.value); setPage(0); }}
              style={{ 
                padding: "0.6rem 1rem", 
                border: "1px solid var(--border-subtle)", 
                borderRadius: "8px", 
                backgroundColor: "var(--bg-primary)",
                color: "var(--fg-primary)",
                outline: "none"
              }}
            >
              <option value="">All Types</option>
              <option value="MCQ">MCQ</option>
              <option value="TRUE_FALSE">True/False</option>
              <option value="SUBJECTIVE">Subjective</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div style={{ color: "var(--state-danger)", marginBottom: "1rem" }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading question bank...</div>
      ) : (
        <>
          <div className="list-rows">
            <div className="flat-row" style={{ fontWeight: 600, borderBottom: "2px solid var(--border-subtle)", backgroundColor: "var(--bg-secondary)" }}>
              <span>Question Content</span>
              <span>Topic</span>
              <span>Type / Diff / Marks</span>
              <span>Actions</span>
            </div>
            {questions.length === 0 && (
              <div style={{ color: "var(--fg-secondary)", padding: "2rem", textAlign: "center" }}>
                No questions found matching the selected filters.
              </div>
            )}
            {questions.map((q) => (
              <div key={q.id} className="flat-row">
                <div style={{ paddingRight: "1rem" }}>
                  <div style={{ fontWeight: 500 }}>{truncate(q.questionText, 80)}</div>
                  {q.type === "MCQ" && (
                    <div style={{ fontSize: "0.75rem", color: "var(--fg-secondary)", marginTop: "0.25rem" }}>
                      Options: A: {q.optionA} | B: {q.optionB} | C: {q.optionC} | D: {q.optionD}
                    </div>
                  )}
                </div>
                <div>
                  <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{q.topicName}</span>
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{q.type}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--fg-secondary)" }}>
                    {q.difficulty} | {q.marks} Marks
                  </div>
                </div>
                <div>
                  <button 
                    onClick={() => handleDelete(q.id)} 
                    className="btn btn-secondary" 
                    style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", color: "var(--state-danger)" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem", alignItems: "center" }}>
              <button 
                onClick={() => setPage((p) => Math.max(0, p - 1))} 
                disabled={page === 0}
                className="btn btn-secondary"
                style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
              >
                Previous
              </button>
              <span style={{ fontSize: "0.9rem", color: "var(--fg-secondary)" }}>
                Page {page + 1} of {totalPages}
              </span>
              <button 
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} 
                disabled={page === totalPages - 1}
                className="btn btn-secondary"
                style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
