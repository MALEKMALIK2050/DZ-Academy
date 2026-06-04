import { useState } from "react";

export default function Pretest({ questions, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);

  const handleAnswer = (qid, value) => {
    setAnswers({ ...answers, [qid]: value });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Prétest</h1>
      <div className="mb-6">
        <p className="text-gray-600">
          Question {current + 1} / {questions.length}
        </p>
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <p className="font-semibold">{questions[current].texte}</p>
          {questions[current].options.map((opt, i) => (
            <label key={i} className="block mt-2">
              <input
                type="radio"
                name={`q-${questions[current].id}`}
                value={opt}
                checked={answers[questions[current].id] === opt}
                onChange={() => handleAnswer(questions[current].id, opt)}
              />
              <span className="ml-2">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          disabled={current === 0}
          onClick={() => setCurrent(current - 1)}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Précédent
        </button>
        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(current + 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={() => onSubmit(answers)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Soumettre
          </button>
        )}
      </div>
    </div>
  );
}
