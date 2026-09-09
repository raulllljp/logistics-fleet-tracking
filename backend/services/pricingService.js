const BASE_FEE = 50;
const RATE_PER_KM = 10;

const calculateShipmentCost = (weight, distance) => {
  const invalid = () => Object.assign(new Error("Weight must be positive and distance nonnegative, with a finite representable price"), {
    statusCode: 400, errorCode: "INVALID_PRICING_INPUT",
  });
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(distance) || distance < 0) throw invalid();
  const weightSurcharge = weight <= 5 ? 0 : weight <= 10 ? 50 : weight <= 20 ? 100 : 200;
  const total = BASE_FEE + distance * RATE_PER_KM + weightSurcharge;
  if (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER / 100) throw invalid();
  return Math.round((total + Number.EPSILON) * 100) / 100;
};

module.exports = { calculateShipmentCost, BASE_FEE, RATE_PER_KM };
