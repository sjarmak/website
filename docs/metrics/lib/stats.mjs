/**
 * Small-sample descriptive statistics.
 *
 * Every summary carries its own n, and quantiles above the median refuse to
 * report when n is too small to place them. With n below 20 a p95 is an
 * order statistic sitting on the maximum, so reporting it as a percentile
 * invites a reader to treat one observation as a distribution. The functions
 * here return null for that case rather than a number.
 */

/** Minimum n before a p95 is meaningful as anything other than the maximum. */
export const P95_MIN_N = 20;

/** Minimum n before a median is worth printing at all. */
export const MEDIAN_MIN_N = 3;

/**
 * @param {number[]} values
 * @param {number} q quantile in [0,1]
 * @returns {number|null}
 */
export function quantile(values, q) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * Descriptive summary that refuses to overstate a small sample.
 * @param {number[]} values
 * @returns {{n:number,min:number|null,median:number|null,mean:number|null,p95:number|null,max:number|null,p95_suppressed_reason:string|null,median_suppressed_reason:string|null}}
 */
export function summarize(values) {
  const clean = (values ?? []).filter((v) => Number.isFinite(v));
  const n = clean.length;
  if (n === 0) {
    return {
      n: 0,
      min: null,
      median: null,
      mean: null,
      p95: null,
      max: null,
      p95_suppressed_reason: 'n=0',
      median_suppressed_reason: 'n=0',
    };
  }
  const sorted = [...clean].sort((a, b) => a - b);
  const medianOk = n >= MEDIAN_MIN_N;
  const p95Ok = n >= P95_MIN_N;
  return {
    n,
    min: sorted[0],
    median: medianOk ? quantile(sorted, 0.5) : null,
    mean: clean.reduce((a, b) => a + b, 0) / n,
    p95: p95Ok ? quantile(sorted, 0.95) : null,
    max: sorted[n - 1],
    p95_suppressed_reason: p95Ok ? null : `n=${n} < ${P95_MIN_N}; a p95 here is the maximum wearing a percentile label`,
    median_suppressed_reason: medianOk ? null : `n=${n} < ${MEDIAN_MIN_N}`,
  };
}

/**
 * Wilson score interval for a proportion. Reported instead of a bare
 * percentage so a rate computed from a handful of events shows its width.
 * @param {number} successes
 * @param {number} trials
 * @param {number} z 1.96 for 95%
 */
export function wilsonInterval(successes, trials, z = 1.96) {
  if (!Number.isFinite(trials) || trials <= 0) return null;
  const p = successes / trials;
  const denom = 1 + (z * z) / trials;
  const centre = p + (z * z) / (2 * trials);
  const spread = z * Math.sqrt((p * (1 - p)) / trials + (z * z) / (4 * trials * trials));
  return {
    point: p,
    lower: Math.max(0, (centre - spread) / denom),
    upper: Math.min(1, (centre + spread) / denom),
    trials,
    successes,
  };
}

/**
 * Inverse standard normal CDF (Acklam's rational approximation, relative error
 * below 1.15e-9). Present because the two z values below are parameters, not
 * constants: an earlier revision hardcoded z(0.05) and branched z(power) two
 * ways, which silently returned the power=0.9 answer for every power above 0.9
 * and ignored `alpha` entirely. A sample-size function that quietly answers a
 * different question than the one asked is worse than one that throws.
 * @param {number} p in (0, 1)
 */
export function normalQuantile(p) {
  if (!(p > 0 && p < 1)) throw new RangeError(`normalQuantile: p must be in (0,1), got ${p}`);
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416];
  const pLow = 0.02425;
  let q;
  let r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pLow) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  q = p - 0.5;
  r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * Trials needed to detect a change from p0 to p1 at the given power, two-sided.
 * Normal approximation, per arm. Used to state what n a claimed improvement
 * would require rather than reporting a percentage from the n on hand.
 */
export function requiredNPerArm(p0, p1, alpha = 0.05, power = 0.8) {
  if (!(p0 >= 0 && p0 <= 1 && p1 >= 0 && p1 <= 1) || p0 === p1) return null;
  const zAlpha = normalQuantile(1 - alpha / 2);
  const zBeta = normalQuantile(power);
  const pBar = (p0 + p1) / 2;
  const numerator =
    zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + zBeta * Math.sqrt(p0 * (1 - p0) + p1 * (1 - p1));
  return Math.ceil((numerator * numerator) / ((p1 - p0) * (p1 - p0)));
}
