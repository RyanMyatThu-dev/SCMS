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
