import React, { useState } from "react";

const STATUS_OPTIONS = ["ok", "issue", "na"];

const CONDITIONS = [
  "hard",
  "noise",
  "play",
  "replaced"
];

const SteeringEdit = ({
  initialData = {},
  onSave,
  onCancel,
  saving = false,
}) => {
  const steering = initialData?.steering || {};

  const [status, setStatus] = useState(
    steering.status || "ok"
  );

  const [hard, setHard] = useState(
    steering.hard || false
  );

  const [abnormalNoise, setAbnormalNoise] = useState(
    steering.abnormal_noise || false
  );

  const [conditions, setConditions] = useState(
    steering.conditions || []
  );

  const [notes, setNotes] = useState(
    steering.notes || ""
  );

  const toggleCondition = (condition) => {
    if (conditions.includes(condition)) {
      setConditions(
        conditions.filter((c) => c !== condition)
      );
    } else {
      setConditions([...conditions, condition]);
    }
  };

  const handleSubmit = () => {
    const fd = new FormData();

    fd.append("steering[status]", status);
    fd.append("steering[hard]", hard);
    fd.append(
      "steering[abnormal_noise]",
      abnormalNoise
    );
    fd.append("steering[notes]", notes);

    conditions.forEach((c) => {
      fd.append("steering[conditions][]", c);
    });

    onSave(fd);
  };

  return (
    <div className="space-y-4">

      {/* Status */}
      <div className="bg-white rounded-xl p-4 border">
        <label className="block mb-3 font-semibold">
          Steering Status
        </label>

        <div className="flex gap-2">
          {STATUS_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`px-4 py-2 rounded-lg border ${
                status === item
                  ? "bg-blue-500 text-white"
                  : ""
              }`}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div className="bg-white rounded-xl p-4 border">
        <label className="block mb-3 font-semibold">
          Conditions
        </label>

        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((condition) => (
            <button
              key={condition}
              type="button"
              onClick={() =>
                toggleCondition(condition)
              }
              className={`px-3 py-2 rounded-lg border ${
                conditions.includes(condition)
                  ? "bg-orange-500 text-white"
                  : ""
              }`}
            >
              {condition}
            </button>
          ))}
        </div>
      </div>

      {/* Hard */}
      <div className="bg-white rounded-xl p-4 border flex items-center justify-between">
        <span>Steering Hard</span>

        <input
          type="checkbox"
          checked={hard}
          onChange={(e) =>
            setHard(e.target.checked)
          }
        />
      </div>

      {/* Noise */}
      <div className="bg-white rounded-xl p-4 border flex items-center justify-between">
        <span>Abnormal Noise</span>

        <input
          type="checkbox"
          checked={abnormalNoise}
          onChange={(e) =>
            setAbnormalNoise(
              e.target.checked
            )
          }
        />
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl p-4 border">
        <label className="block mb-2 font-semibold">
          Notes
        </label>

        <textarea
          rows={4}
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
          className="w-full border rounded-lg p-3"
          placeholder="Enter steering notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border rounded-xl py-3"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-blue-600 text-white rounded-xl py-3"
        >
          {saving ? "Saving..." : "Update Steering"}
        </button>
      </div>
    </div>
  );
};

export default SteeringEdit;