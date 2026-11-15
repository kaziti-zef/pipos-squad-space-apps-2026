# AgriRot – How rotations are evaluated

**Scoring principle: a critique and proposal engine** (NASA International Space Apps Challenge 2026, challenge *Field Shift: Adapting Farms with NASA Data*).

> **Central principle.** Proposing a rotation means criticising a large number of candidate rotations and keeping the best ones. The engine is therefore first of all an **evaluator**: it takes a rotation, confronts it with the data (NASA, soil, crop table, pest table) and returns, for each criterion, a **score, reasons, evidence and a confidence level**.

---

## 1. How a rotation is represented

The study horizon (2 to 3 years) is cut into monthly time steps $t = 1, \dots, T$. A rotation is an ordered sequence of occupations of the plot:

$$R = (o_1, o_2, \dots, o_K), \qquad o_k = (c_k, d_k, f_k)$$

where $c_k$ is a crop from the crop table, $d_k$ is the sowing (or planting) month and $f_k$ is the harvest month, with $f_k - d_k + 1 = L(c_k)$, the cycle length in months.

- Months not covered by an occupation are periods of **bare soil** (or fallow), written $c_t = \emptyset$.
- $c_t$ is the crop present in month $t$. For an occupation $k$, $T_k = \{d_k, \dots, f_k\}$ is the set of its months.
- Time is also cut into **growing seasons** $s = 1, \dots, S$: two per year in the bimodal zones of southern Cameroon, one in the north. The pest model (section 4.5) works season by season.

### Data used

| Block | Content |
|---|---|
| Climate | Monthly series over $Y$ years (ideally $Y \ge 20$): mean, minimum and maximum temperature, rainfall, ET0 (NASA POWER, GPM IMERG) |
| Terrain | Slope (SRTM), soil pH and texture (SoilGrids or a soil analysis), irrigation (yes/no) |
| Crop table | Climate thresholds, Kc and stage durations (FAO-56), nitrogen, residues, ground cover, uses |
| Pest table | Hosts, cleansing crops, survival without host, effectiveness of rotation, severity |
| Farmer | Current rotation, priorities, constraints, sanitary history of the plot |

---

## 2. Level 1: eliminating rules

A rotation is **admissible** if it respects all the constraints below. A rotation that is not admissible is not proposed. If it is the farmer's current rotation, it is evaluated anyway and the violations are displayed first.

| Rule | Constraint |
|---|---|
| **C1** Absolute climate limits | For every occupation $k$ and month $t \in T_k$: $T^{abs}_{min}(c_k) \le T^{10\%}_{min}(t)$ and $T^{90\%}_{max}(t) \le T^{abs}_{max}(c_k)$, where $T^{10\%}_{min}(t)$ is the 10th interannual percentile of the minimum temperature of month $t$ and $T^{90\%}_{max}(t)$ the 90th percentile of the maximum. Annual rainfall is also compared with $[P^{abs}_{min}, P^{abs}_{max}]$, unless the plot is irrigated. |
| **C2** Respect of the season | Without irrigation, the cycle must fit in the rainy season, with a tolerance $\tau$ (for example one month) for ripening: $d_k \ge$ rain start and $f_k \le$ rain end $+ \tau$. |
| **C3** No overlap | $d_{k+1} > f_k$ for all $k$, except for explicitly declared associations. |
| **C4** Return interval | If a crop $c$ appears at $k$ and at $k' > k$, the gap between the two, in years, is at least the return interval $r(c)$ from the crop table. |
| **C5** Succession of families | $\text{family}(c_{k+1}) \ne \text{family}(c_k)$. |
| **C6** Soil | The plot pH is within $[pH_{min}(c_k), pH_{max}(c_k)]$, with a tolerance, and the drainage is compatible. |
| **C7** Serious sanitary alert | A very sensitive crop is not planted when the pressure of one of its serious pests is already above a critical threshold (see section 4.5). |

Some rules (C5 and C7) can be made **soft** by configuration: a violation then becomes a strong penalty instead of an exclusion. This keeps the solution space from becoming empty in a zone where few crops are possible.

The farmer's declared constraints (labour, equipment, refused crops) are added to Level 1.

---

## 3. Level 2: scores by criterion

Each admissible rotation receives six scores $S_1, \dots, S_6 \in [0, 100]$. We write $\text{clip}(x) = \min(100, \max(0, x))$.

| Score | Criterion |
|---|---|
| $S_1$ | Climate suitability |
| $S_2$ | Water |
| $S_3$ | Fertility (nitrogen and organic matter) |
| $S_4$ | Erosion |
| $S_5$ | Diseases and pests |
| $S_6$ | Fit with the farmer's priorities |

---

## 4. The six criteria

### 4.1 S1: climate suitability

For each occupation $k$, we measure the share of the cycle's months where the climatological mean temperature is inside the optimal range, and we penalise extreme-heat days during mid-season (flowering, grain filling):

$$a_k = \frac{1}{|T_k|} \sum_{t \in T_k} \mathbf{1}\!\left[T^{opt}_{min}(c_k) \le T(t) \le T^{opt}_{max}(c_k)\right] - \lambda_{ch}\,\frac{J^{heat}_k}{D^{mid}_k}$$

$J^{heat}_k$ is the mean number of days above $T^{opt}_{max}(c_k) + 5\,°\text{C}$ during the mid-season stage, of duration $D^{mid}_k$ days.

$$S_1 = \text{clip}\!\left(100 \cdot \frac{1}{K} \sum_{k=1}^{K} a_k\right)$$

### 4.2 S2: water

**Crop need (FAO-56).** For each month $t$ of the cycle, the crop coefficient $K_c(t)$ is interpolated between $K_{c,ini}$, $K_{c,mid}$ and $K_{c,fin}$ according to the durations of the four stages:

$$ET_c(t, y) = K_c(t) \cdot ET_0(t, y)$$

**Satisfaction.** With $P_{eff}(t, y)$ the effective rainfall of month $t$ in year $y$ (for example $P_{eff} = \alpha P$ with $\alpha \approx 0.8$, or the USDA-SCS method), the water satisfaction rate of occupation $k$ in year $y$ is:

$$\sigma_{k,y} = \frac{\sum_{t \in T_k} \min\big(P_{eff}(t, y) + I(t),\; ET_c(t, y)\big)}{\sum_{t \in T_k} ET_c(t, y)} \in [0, 1]$$

where $I(t)$ is the available irrigation (zero by default). A finer version adds a soil reservoir of capacity $RU = \theta \cdot z_r$ (useful reserve depending on texture and rooting depth).

**Probability of success.** We do not look at an average year, but at the frequency of good years:

$$p_k = \frac{1}{Y} \sum_{y=1}^{Y} \mathbf{1}\!\left[\sigma_{k,y} \ge \sigma^*\right], \qquad \sigma^* \approx 0.8$$

**Score.** With $\eta(c) \in \{0.5, 1, 1.5\}$ according to drought sensitivity (low, medium, high):

$$S_2 = \text{clip}\!\left(100 \cdot \frac{1}{K} \sum_{k=1}^{K} \big(1 - \eta(c_k)(1 - p_k)\big)\right)$$

Example of an explanation produced: *"In 7 years out of 25, the second-season maize received less than 80 % of its water need, mostly in October."*

### 4.3 S3: fertility (nitrogen and organic matter)

**Nitrogen balance by points.** For each occupation:

$$n_k = \nu_{fix} \cdot \mathbf{1}[\texttt{fixe\_azote}(c_k)] - \nu_{bes} \cdot b(c_k), \qquad b \in \{1, 2, 3\} \text{ (low, medium, high)}$$

The first term is the legume contribution, the second the crop's need. A penalty $\nu_{seq}$ is added each time two high-need crops follow each other, and a bonus $\nu_{pre}$ when a demanding crop directly follows a legume:

$$N(R) = \sum_k n_k - \nu_{seq} \sum_k \mathbf{1}[b(c_k) = b(c_{k+1}) = 3] + \nu_{pre} \sum_k \mathbf{1}[\texttt{fixe\_azote}(c_k) \wedge b(c_{k+1}) = 3]$$

**Organic matter.** With $m(c) \in \{1, 2, 3\}$ for residues (low, medium, high) and $\epsilon_k \in [0, 1]$ the share of residues returned to the soil (declared by the farmer: 0 if burned or exported):

$$M(R) = \frac{1}{\text{years}} \sum_k \epsilon_k \, m(c_k)$$

**Score.** After normalising $N$ and $M$ to $[0, 100]$ (against the extreme values among the candidates, or against fixed bounds):

$$S_3 = 0.6\,\hat{N} + 0.4\,\hat{M}$$

### 4.4 S4: erosion

A simplified version of the Revised Universal Soil Loss Equation (RUSLE: $A = R \cdot K \cdot LS \cdot C \cdot P$). Only what the rotation changes is kept, the cover $C$, modulated by the aggressiveness of rainfall $R$ and the slope $LS$.

- **Monthly cover** $\kappa(t) \in [0, 1]$: 0 for bare soil. During a crop, $\kappa$ grows with the stages (initial: low; development: intermediate; mid-season: maximal), the maximum depending on `couverture_sol` (low: 0.4; medium: 0.7; high: 0.9).
- **Rainfall aggressiveness** $R(t)$: the climatological share of annual rainfall falling in intense episodes in month $t$ (days above the daily 95th percentile, GPM IMERG).
- **Slope factor** $\Lambda = \min(1,\ \text{slope} / 15\,\%)$ (SRTM).

$$E(R) = \Lambda \cdot \frac{\sum_{t=1}^{T} \big(1 - \kappa(t)\big)\, R(t)}{\sum_{t=1}^{T} R(t)}, \qquad S_4 = \text{clip}\big(100\,(1 - E(R))\big)$$

The months that contribute most to $E$ are listed as **risk windows**, with a suggested cover crop.

### 4.5 S5: diseases and pests

**Idea.** Rotation acts on a pest by depriving it of a host. So for each pest $g$ of the table, a pressure $P_g(s)$ is followed season by season: it rises when a host crop is present and decays otherwise, at a speed that depends on its survival without a host.

**Pests concerned.** Only pests on which rotation has an effect are scored:

$$G = \{g : \text{type}(g) \in \{\text{soil, residues, parasitic plant}\} \text{ and } \text{rotation\_efficace}(g) \in \{\text{strong, medium}\}\}$$

The others (mobile insects, viruses spread by vectors or by planting material, storage pests) are not scored. They trigger **advice outside rotation** as soon as one of their host crops is present.

**Parameters from the pest table.**

| Symbol | Meaning | Default values |
|---|---|---|
| $h_g(c)$ | Role of crop $c$ for pest $g$ | 1 (strong host), 0.5 (moderate host), 0 otherwise |
| $\delta_g$ | Persistence from one season to the next without a host | short 0.3; medium 0.6; long 0.85; very long 0.95 |
| $\rho$ | Effect of a cleansing or trap crop | 0.3 |
| $\gamma_g$ | Severity | 1 (low), 2 (medium), 3 (high) |
| $P_{max}$ | Pressure ceiling | 3 |
| $P_g(0)$ | Initial pressure | 0, or 1 to 2 if the farmer has already observed $g$ |

**Pressure dynamics.** For each season $s$, with $c_s$ the main crop of the season:

$$P_g(s) = \begin{cases} \min\big(P_{max},\ \delta_g P_g(s-1) + h_g(c_s)\big) & \text{if } h_g(c_s) > 0 \\ \rho\, \delta_g\, P_g(s-1) & \text{if } c_s \text{ is cleansing or trap for } g \\ \delta_g\, P_g(s-1) & \text{otherwise (non-host, fallow, bare soil)} \end{cases}$$

**Exposure and penalty.** What matters is the pressure met by a sensitive crop when it is sown:

$$x_{g,s} = h_g(c_s) \cdot P_g(s-1), \qquad \Pi(R) = \frac{1}{S} \sum_{g \in G} \gamma_g \left(\sum_s x_{g,s} + \varphi \cdot N_{fam}(R)\right)$$

$N_{fam}$ counts the successions of the same family (when rule C5 is configured as soft). Dividing by the number of seasons $S$ makes it possible to compare rotations of different lengths.

$$S_5 = 100 \cdot \exp\!\big(-\Pi(R) / \Pi_0\big)$$

$\Pi_0$ is a scale factor (for example the mean penalty of the candidate rotations). The exponential form keeps the score in $[0, 100]$ and strongly penalises accumulation.

**Serious alert (rule C7).** If $h_g(c_s) = 1$, $\gamma_g = 3$ and $P_g(s-1) \ge P_{crit}$ (for example 1.5), the rotation is excluded or strongly penalised.

**Steady state.** A rotation repeats. To avoid depending on the initial pressure, two complete cycles are simulated and $\Pi$ is computed only on the second.

**Algorithm: computing the pest score $S_5$**

```
Inputs : rotation R cut into seasons c_1 ... c_S, pest table, plot history
Outputs: score S5, list of explanations, list of advice outside rotation

Pi <- 0
for each pest g in the table:
    if g is not in G:
        if a crop of R is a host of g:
            add the outside-rotation advice for g
        continue
    P <- P_g(0)
    for cycle = 1, 2:
        for s = 1 ... S:
            x <- h_g(c_s) * P
            if cycle = 2:
                Pi <- Pi + gamma_g * x
                if x > 0 and P >= P_threshold:
                    add the explanation "c_s sown on a high pressure of g"
            update P with the pressure dynamics above
Pi <- Pi / S
S5 <- 100 * exp(-Pi / Pi0)
```

### 4.6 S6: fit with the farmer's priorities

The farmer distributes weights $\pi_u \ge 0$, with $\sum_u \pi_u = 1$, over the uses $u \in \{\text{sale, food, fodder, } \dots\}$. With $U(c)$ the set of uses of crop $c$ and $\theta_u(R)$ the share of seasons occupied by a crop that fulfils use $u$:

$$\theta_u(R) = \frac{1}{S} \sum_{s=1}^{S} \mathbf{1}[u \in U(c_s)], \qquad S_6 = 100 \sum_u \pi_u\, \theta_u(R)$$

---

## 5. Aggregation and comparison

**Weights.** The farmer sets sliders $w_i \in \{0, \dots, 5\}$ ("save water", "improve my soil", "make money", and so on), translated into weights on the criteria. The overall score is used to rank:

$$G(R) = \frac{\sum_{i=1}^{6} w_i\, S_i(R)}{\sum_{i=1}^{6} w_i}$$

**Display.** The vector $(S_1, \dots, S_6)$ is always shown (radar chart) together with the gap to the current rotation $R_0$:

$$\Delta_i = S_i(R) - S_i(R_0)$$

**Choice of proposals.** Candidates are generated by enumerating the possible successions of crops in the zone, filtered by Level 1, then ranked by $G$. Two to three **different** rotations are kept: for example the best for $G$, then the best among those whose Jaccard distance (on the set of crops) from the rotations already kept exceeds a threshold, or the best rotation for each of the two most weighted criteria.

---

## 6. Explanations and confidence

Each term that weighs in a score produces a structured explanation:

| Field | Example |
|---|---|
| Criterion and verdict | Erosion: high risk |
| Reason | Bare soil in March, start of the rains |
| Numerical evidence | 35 % of March rain in intense episodes (GPM IMERG, 2001–2025); slope 8 % (SRTM) |
| Suggestion | Sow cowpea or mucuna as a cover crop |
| Confidence | Medium |
| To confirm locally | Actual cover depending on sowing density |

**Confidence.** For each criterion, confidence is lowered when:

- a parameter used is marked in the `a_verifier` column of the crop table or of the pest table;
- the climate data varies strongly from year to year (high coefficient of variation);
- the data comes from a grid that is coarse compared with the plot (SMAP at about 9 km, for example);
- the information depends on unknown practices (residue export, sowing density, actual presence of a pest).

Three levels are displayed: **high, medium, low**.

---

## 7. Parameters

| Parameter | Role | Starting value |
|---|---|---|
| $\lambda_{ch}$ | Weight of heat days (S1) | 0.5 |
| $\alpha$ | Effective share of rainfall (S2) | 0.8 |
| $\sigma^*$ | Water satisfaction threshold (S2) | 0.8 |
| $\nu_{fix}, \nu_{bes}, \nu_{seq}, \nu_{pre}$ | Nitrogen points (S3) | 3; 1; 2; 1 |
| $\kappa_{max}$ | Maximum cover per class (S4) | 0.4; 0.7; 0.9 |
| $\delta_g, \rho, P_{max}, P_{crit}$ | Pest dynamics (S5) | see section 4.5 |
| $\varphi$ | Same-family penalty (S5) | 2 |

---

## 8. Honesty of the model

These formulas are **explainable heuristics, not a validated agronomic model**. They serve to rank options and to explain why, not to predict a yield. The default values must be discussed with local agronomists (IRAD, extension services), and the tool reminds the farmer of this: it supports the decision, it does not replace it.

---

## References

- Allen R.G., Pereira L.S., Raes D., Smith M. (1998). *Crop evapotranspiration: Guidelines for computing crop water requirements.* FAO Irrigation and Drainage Paper 56.
- FAO. *EcoCrop: Database of crop constraints and characteristics.*
- FAO. *Crop Calendar* (crop calendars by agro-ecological zone).
- Renard K.G. et al. (1997). *Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE).* USDA Agriculture Handbook 703.
- NASA POWER, GPM IMERG, SMAP, SRTM: product documentation on the NASA portals.
