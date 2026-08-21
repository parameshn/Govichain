import { useState } from "react";
import axios from "axios";

export default function MilestoneAI() {
    const [projectType, setProjectType] = useState("road");
    const [milestone, setMilestone] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await axios.post(
                "http://127.0.0.1:8000/milestone/evaluate",
                {
                    project_type: projectType,
                    milestone: milestone,
                }
            );

            setResult(res.data.ai_response);
        } catch (err) {
            console.error(err);
            alert("Error calling AI");
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>AI Compliance Check</h2>

            <select onChange={(e) => setProjectType(e.target.value)}>
                <option value="road">Road</option>
                <option value="health">Health</option>
            </select>

            <br /><br />

            <textarea
                rows="5"
                cols="50"
                placeholder="Enter milestone details..."
                onChange={(e) => setMilestone(e.target.value)}
            />

            <br /><br />

            <button onClick={handleSubmit}>
                {loading ? "Checking..." : "Check Compliance"}
            </button>

            {result && (
                <div style={{ marginTop: "20px" }}>
                    <h3>AI Result:</h3>
                    <pre>{result}</pre>
                </div>
            )}
        </div>
    );
}