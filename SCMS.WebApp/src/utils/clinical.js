export const dosageOptions = [
  { value: "Once daily", label: "Once daily", dosesPerDay: 1 },
  { value: "Twice daily", label: "Twice daily", dosesPerDay: 2 },
  { value: "Three times daily", label: "Three times daily", dosesPerDay: 3 },
  { value: "Four times daily", label: "Four times daily", dosesPerDay: 4 },
  { value: "As needed", label: "As needed", dosesPerDay: 1 },
  { value: "Custom", label: "Custom", dosesPerDay: 1 },
];

export const commonDosageValues = dosageOptions.map((option) => option.value);

export const getDosesPerDay = (dosage) =>
  dosageOptions.find((option) => option.value === dosage)?.dosesPerDay ?? 1;

export const calculateQuantity = (dosage, days) =>
  Math.max(1, getDosesPerDay(dosage) * Math.max(1, Number(days) || 1));

export const celsiusToFahrenheit = (temperatureC) => {
  const value = Number(temperatureC);
  if (!Number.isFinite(value)) return null;
  return Math.round(((value * 9) / 5 + 32) * 10) / 10;
};

export const fahrenheitToCelsius = (temperatureF) => {
  const value = Number(temperatureF);
  if (!Number.isFinite(value)) return null;
  return Math.round(((value - 32) * 5 / 9) * 10) / 10;
};

export const formatTemperatureF = (temperatureC) => {
  const value = celsiusToFahrenheit(temperatureC);
  return value == null ? "-" : `${value} °F`;
};

/**
 * Safely parses prescription notes and extracts clean clinical advice,
 * biometric vitals, and lab orders for doctor and patient UI presentation.
 */
export const parsePrescriptionData = (prescription) => {
  if (!prescription) {
    return {
      actualNotes: "",
      vitals: {},
      labTests: [],
      hasVitals: false,
    };
  }

  let notesText = typeof prescription === "string" ? prescription : prescription.notes || "";
  let extracted = {};

  if (typeof notesText === "string" && notesText.trim().startsWith("{") && notesText.trim().endsWith("}")) {
    try {
      extracted = JSON.parse(notesText.trim());
      notesText = extracted.ActualNotes || extracted.notes || "";
    } catch {
      // not JSON format
    }
  }

  const bpSys = prescription.bloodPressureSystolic ?? extracted.BloodPressureSystolic ?? null;
  const bpDia = prescription.bloodPressureDiastolic ?? extracted.BloodPressureDiastolic ?? null;
  const tempC = prescription.temperatureC ?? extracted.TemperatureC ?? null;
  const pulse = prescription.pulseBpm ?? extracted.PulseBpm ?? null;
  const spo2 = prescription.spo2Percent ?? extracted.Spo2Percent ?? null;
  const weight = prescription.weightKg ?? extracted.WeightKg ?? null;
  const height = prescription.heightCm ?? extracted.HeightCm ?? null;
  const bmi = prescription.bmi ?? extracted.Bmi ?? null;

  const rawLabTests = prescription.labTestRequests || extracted.LabTestRequests || "";
  const labTests = typeof rawLabTests === "string"
    ? rawLabTests.split(",").map((t) => t.trim()).filter(Boolean)
    : Array.isArray(rawLabTests)
    ? rawLabTests
    : [];

  const hasVitals = Boolean(
    (bpSys && bpDia) ||
    tempC != null ||
    pulse != null ||
    spo2 != null ||
    weight != null ||
    height != null ||
    bmi != null
  );

  return {
    actualNotes: notesText,
    vitals: {
      bloodPressure: bpSys && bpDia ? `${bpSys}/${bpDia} mmHg` : null,
      temperatureC: tempC,
      temperatureF: tempC != null ? celsiusToFahrenheit(tempC) : null,
      pulseBpm: pulse ? `${pulse} bpm` : null,
      spo2: spo2 ? `${spo2}%` : null,
      weightKg: weight ? `${weight} kg` : null,
      heightCm: height ? `${height} cm` : null,
      bmi: bmi ? `${bmi}` : null,
    },
    labTests,
    hasVitals,
  };
};

export const parsePrescriptionNotes = (rawNotesOrRx) => {
  return parsePrescriptionData(rawNotesOrRx).actualNotes;
};
