# Open-Source Implementations and Replication Plan

> **Project:** Vision-Based Food Calorie and Nutrition Estimation  
> **Goal:** Reproduce the strongest publicly inferable ideas from Cal AI, SnapCalorie, Foodvisor, Passio, and MyFitnessPal using open-source code, public SDKs, research datasets, and reproducible geometry.

---

## Executive summary

A competitive food-calorie system does not require one proprietary `image → calories` model. Nearly every subproblem has a public implementation:

- food segmentation,
- multimodal food recognition,
- monocular metric depth,
- RGB-D capture,
- fiducial pose estimation,
- support-plane recovery,
- point-cloud generation,
- volume estimation,
- density-to-mass conversion,
- nutrition retrieval,
- multi-view reconstruction,
- correction loops,
- 3D-aware training.

The main research opportunity is the integration and evaluation:

$$
\boxed{
\text{How much does real metric geometry improve nutrition estimation over learned visual priors?}
}
$$

The most informative comparison is:

$$
\text{VLM only}
\;\text{vs.}\;
\text{VLM + metric depth}
\;\text{vs.}\;
\text{VLM + fiducial}
\;\text{vs.}\;
\text{VLM + sensor depth}
\;\text{vs.}\;
\text{VLM + fiducial + real multi-view}.
$$

---

# 1. Commercial feature → reproducible replacement

| Commercial idea | Reproducible replacement |
|---|---|
| Cal AI-style multimodal meal understanding | Qwen3-VL, InternVL |
| Cal AI-style structured meal object | JSON Schema/Pydantic constrained output |
| Cal AI-style `fixFood` correction | image + previous result + user correction → revised result |
| Cal AI-style RAG | USDA FoodData Central, Open Food Facts, regional composition tables |
| SnapCalorie-like depth/volume | ARKit/AVDepthData, ARCore Depth, Open3D |
| Foodvisor-like scale reasoning | camera intrinsics/metadata + support plane + calibrated reference |
| Passio-like volume estimation | dual-camera/RGB-D/motion depth + metric reconstruction |
| Passio-like ontology | visual concept → candidate dish → nutrition entity |
| MyFitnessPal-like verified foods | retrieval from authoritative databases |
| Known calibration object | AprilTag/ArUco + OpenCV PnP |
| Precision multi-view | ARKit/ARCore poses, COLMAP, OpenMVS |
| 3D-aware food regression | MFP3D-style RGB + point-cloud fusion |
| Cheap RGB deployment after 3D training | PortionNet-style cross-modal distillation |

---

# 2. Highest-priority repositories

## 2.1 Nutrition Estimation via Segmentation and Depth

**Repository:**  
https://github.com/anhlehong/Nutrition-Estimation-via-Segmentation-and-Depth

This is one of the closest public end-to-end implementations to the project.

Conceptually:

$$
I
\rightarrow
\text{food segmentation}
\rightarrow
\text{depth}
\rightarrow
\text{volume}
\rightarrow
\text{density}
\rightarrow
\text{mass}
\rightarrow
\text{USDA nutrition}.
$$

Useful pieces:

- integrated pipeline structure,
- segmentation/depth integration,
- density lookup,
- USDA integration,
- backend/frontend examples,
- notebooks and Docker.

**Recommended use:** keep the architectural decomposition but replace older segmentation/depth components with SAM 2, UniDepth/Metric3D, OpenCV PnP, and Open3D.

---

## 2.2 AlexGraikos / food_volume_estimation

**Repository:**  
https://github.com/AlexGraikos/food_volume_estimation

This repository is especially valuable for understanding the geometry of:

$$
(I,S,D,K,\text{scale prior})
\rightarrow
\text{3D points}
\rightarrow
V
\rightarrow
m.
$$

It supports a known plate diameter as a metric-scale prior and includes food-density conversion.

**Recommended use:** port the geometric logic into a modern stack:

```text
Python 3.11+
PyTorch 2.x
OpenCV 4.x
Open3D
NumPy
```

This should become the classical geometry baseline.

---

## 2.3 SAM 2

**Repository:**  
https://github.com/facebookresearch/sam2

Use for:

- image segmentation,
- multiple food masks,
- video mask propagation,
- tracking the same food component across guided multi-view capture,
- fine-tuning.

For a meal with $M$ components:

$$
S=\{S_1,\ldots,S_M\}.
$$

SAM 2 is especially valuable in the precision-scan mode because the same object identity can be propagated through:

$$
I_1,I_2,\ldots,I_N.
$$

---

## 2.4 FoodSAM

**Repository:**  
https://github.com/jamesjg/FoodSAM

FoodSAM combines SAM-style masks with food-specific semantic information and provides food semantic/instance/panoptic segmentation.

Use it as a **food-specific academic baseline**, not necessarily the production dependency, because its dependency stack is older.

Compare:

$$
\text{FoodSAM}
\quad\text{vs.}\quad
\text{detector/VLM + SAM 2}.
$$

---

## 2.5 UniDepth

**Repository:**  
https://github.com/lpiccinelli-eth/UniDepth

Use as a strong RGB-only metric-depth baseline.

A useful abstraction is:

$$
I\rightarrow
\{\hat D,\hat K,\hat X,\hat Q\},
$$

where:

- $\hat D$ = predicted metric depth,
- $\hat K$ = predicted intrinsics,
- $\hat X$ = predicted point cloud,
- $\hat Q$ = confidence/quality.

Important:

$$
\boxed{
\text{Predicted metric depth is still a learned estimate, not a physical measurement.}
}
$$

---

## 2.6 Metric3D

**Repository:**  
https://github.com/YvanYin/Metric3D

Useful for zero-shot metric depth and surface normals:

$$
I\rightarrow(\hat D,\hat N).
$$

Surface normals may help estimate:

- plate/support plane,
- food surfaces,
- container surfaces,
- geometric discontinuities.

Use as an independent metric-depth comparison to UniDepth.

---

## 2.7 Depth Anything V2

**Repository:**  
https://github.com/DepthAnything/Depth-Anything-V2

Useful for:

- strong relative-depth baseline,
- metric variants,
- depth refinement,
- mobile experiments,
- sparse-depth-guided experiments.

Check checkpoint-specific licenses before commercial use.

---

## 2.8 MFP3D

**Repository:**  
https://github.com/jingema99/MFP3D

MFP3D investigates food portion estimation with image and 3D point-cloud information.

Generic formulation:

$$
f_I=\phi_I(I),\qquad
f_P=\phi_P(P)
$$

$$
f=\operatorname{Fuse}(f_I,f_P)
$$

$$
\hat y=
g(f)
=
[\hat m,\hat V,\widehat{\mathrm{kcal}},\hat P,\hat C,\hat F].
$$

This is a strong reference for testing whether explicit 3D information improves mass and nutrition prediction.

**Caution:** verify repository/license terms before code reuse.

---

## 2.9 PortionNet

**Repository:**  
https://github.com/darrinbright/PortionNet

Interesting because it supports the idea:

$$
\boxed{
\text{use 3D during training, deploy RGB-only inference}
}
$$

Teacher:

$$
T(I,P)\rightarrow z_T
$$

Student:

$$
S(I)\rightarrow z_S
$$

Possible distillation objective:

$$
\mathcal L
=
\mathcal L_{\text{nutrition}}
+
\lambda_d\|z_S-z_T\|_2^2.
$$

This is highly relevant after collecting good RGB-D / 3D training data.

**Caution:** verify current license before reuse.

---

## 2.10 FoodLens

**Repository:**  
https://github.com/porpita1342/FoodLens

Useful as an engineering reference for:

- food segmentation,
- iPhone RGB-D capture,
- client/server design,
- practical experiments with depth and segmentation.

Treat as reference material unless licensing is clearly compatible.

---

## 2.11 Classical reference-object examples

Example:

https://github.com/vinayaksable2399/Food-Calories-Estimation-Using-Image-Processing

Some older systems use a thumb or known reference object to establish scale.

The idea is useful prior art, but a human thumb is a weak metric reference.

Our replacement should be:

$$
\boxed{
\text{known rigid AprilTag/ArUco token}
}
$$

with precisely measured dimensions.

---

# 3. Food segmentation stack

Recommended modern pipeline:

```text
VLM/detector
   ↓
food boxes or point prompts
   ↓
SAM 2
   ↓
component masks
   ↓
video propagation for multi-view
```

Candidate tools:

- SAM 2: https://github.com/facebookresearch/sam2
- FoodSAM: https://github.com/jamesjg/FoodSAM
- Ultralytics/YOLO: https://github.com/ultralytics/ultralytics

For multiple foods:

$$
S=\{S_1,\ldots,S_M\}.
$$

Keep each component separate so geometry and nutrition are estimated component-wise.

---

# 4. Metric depth stack

There are four different kinds of depth and they should not be confused.

## 4.1 Relative monocular depth

Often defined only up to scale/shift:

$$
D'(u,v)=aD(u,v)+b.
$$

Useful for shape and ordering, but not automatically for centimeters.

## 4.2 Learned metric depth

Examples:

- UniDepth,
- Metric3D.

These predict depth in physical units, but the result is still model inference.

## 4.3 Hardware depth

Examples:

- LiDAR,
- stereo,
- dual camera,
- ToF.

These provide actual sensor evidence.

## 4.4 Multi-view geometric depth

For rectified stereo:

$$
\boxed{
Z=\frac{fB}{d}
}
$$

where:

- $f$ = focal length,
- $B$ = known physical baseline,
- $d$ = disparity.

---

# 5. Fiducial token and OpenCV geometry

Useful documentation:

- OpenCV `solvePnP`: https://docs.opencv.org/4.x/d5/d1f/calib3d_solvePnP.html
- ArUco detection: https://docs.opencv.org/4.x/d5/dae/tutorial_aruco_detection.html
- OpenCV repository: https://github.com/opencv/opencv

Let token corners be known 3D points:

$$
X_i=
\begin{bmatrix}
X_i\\Y_i\\0
\end{bmatrix}.
$$

Observed image coordinates are:

$$
x_i=
\begin{bmatrix}
u_i\\v_i
\end{bmatrix}.
$$

Projection:

$$
s_i
\begin{bmatrix}
u_i\\v_i\\1
\end{bmatrix}
=
K[R\mid t]
\begin{bmatrix}
X_i\\Y_i\\0\\1
\end{bmatrix}.
$$

With known token geometry and camera intrinsics, PnP estimates:

$$
\boxed{R,t}.
$$

This gives a metric camera pose relative to the token.

---

## 5.1 Ray-plane intersection

For image pixel:

$$
\tilde x=
\begin{bmatrix}
u\\v\\1
\end{bmatrix}
$$

the camera ray is:

$$
r=K^{-1}\tilde x.
$$

Let the marker/support plane have normal:

$$
n=
R
\begin{bmatrix}
0\\0\\1
\end{bmatrix}
$$

and pass through $t$.

The ray:

$$
X(\lambda)=\lambda r
$$

intersects the plane when:

$$
n^\top(X-t)=0.
$$

Therefore:

$$
\boxed{
\lambda=
\frac{n^\top t}
{n^\top K^{-1}\tilde x}
}
$$

and:

$$
\boxed{
X=
\frac{n^\top t}
{n^\top K^{-1}\tilde x}
K^{-1}\tilde x.
}
$$

This converts plate-plane mask points into **metric coordinates**.

### What the token solves

- metric scale on the support plane,
- camera pose relative to the token,
- support-plane orientation,
- metric food footprint,
- consistent coordinates across views,
- scale recovery in multi-view reconstruction.

### What it does not solve

A planar token does not directly reveal food height:

$$
\boxed{
\text{token alone} \not\Rightarrow \text{full food volume}.
}
$$

We still need depth, multi-view parallax, or a shape prior.

---

# 6. Phone depth and AR

## 6.1 iOS

Relevant Apple frameworks:

- ARKit,
- AVFoundation,
- `ARFrame.sceneDepth`,
- `AVDepthData`.

Documentation:

- https://developer.apple.com/documentation/arkit/arframe/scenedepth
- https://developer.apple.com/documentation/avfoundation/avdepthdata

Capture and preserve:

```text
RGB image
depth map
depth confidence
camera intrinsics
camera pose
timestamp
device model
focal length
fiducial pose
```

Do not reduce the research dataset to JPEGs only.

## 6.2 Android

ARCore Depth:

https://developers.google.com/ar/develop/depth

Useful for:

- depth from supported hardware,
- motion-derived depth,
- camera pose,
- intrinsics.

A serious application can use:

$$
D=
\begin{cases}
D_{\text{LiDAR}}, & \text{supported iOS}\\
D_{\text{ARCore}}, & \text{supported Android}\\
D_{\text{metric model}}, & \text{fallback}.
\end{cases}
$$

---

# 7. Point cloud, volume, and mass

Use Open3D:

https://github.com/isl-org/Open3D

## 7.1 Back-project depth

For pixel $(u,v)$ and depth $Z$:

$$
X=\frac{(u-c_x)Z}{f_x},
\qquad
Y=\frac{(v-c_y)Z}{f_y}.
$$

So:

$$
\boxed{
P(u,v)=
\left(
\frac{(u-c_x)Z}{f_x},
\frac{(v-c_y)Z}{f_y},
Z
\right)
}
$$

for:

$$
(u,v)\in S_j.
$$

## 7.2 Support-plane height

For support plane:

$$
\Pi:n^\top X+d=0,
$$

the signed distance is:

$$
h(X)=
\frac{n^\top X+d}{\|n\|}.
$$

## 7.3 Volume approximation

A depth-grid approximation is:

$$
\boxed{
V\approx
\sum_{(u,v)\in S}
h(u,v)A(u,v)
}
$$

where the physical area of a projected pixel depends approximately on:

$$
A(u,v)\propto\frac{Z(u,v)^2}{f_xf_y}.
$$

A better pipeline is:

1. segment food,
2. back-project to 3D,
3. estimate support plane,
4. filter depth noise,
5. construct food surface,
6. close the food surface against the support plane,
7. calculate mesh/voxel volume.

## 7.4 Convert volume to mass

$$
\boxed{
m=\rho_z V
}
$$

But food density is uncertain.

Better:

$$
\rho
\sim
p(\rho\mid z,r,s)
$$

where $z$ is food identity, $r$ recipe, and $s$ cooking state.

Then:

$$
p(m\mid V,z,r,s)
=
\int
p(m\mid V,\rho)
p(\rho\mid z,r,s)
d\rho.
$$

---

# 8. Multi-view reconstruction

## COLMAP

https://github.com/colmap/colmap

Use for:

- feature matching,
- structure from motion,
- camera pose recovery,
- sparse reconstruction.

## OpenMVS

https://github.com/cdcseacave/openMVS

Use for:

- dense multi-view reconstruction,
- mesh generation,
- surface refinement.

## Nerfstudio

https://github.com/nerfstudio-project/nerfstudio

Use for research experiments involving NeRF.

## 3D Gaussian Splatting

https://github.com/graphdeco-inria/gaussian-splatting

Useful for novel-view and appearance experiments.

Important:

$$
\boxed{
\text{good novel-view rendering}
\neq
\text{accurate watertight metric food volume}
}
$$

Do not substitute visual fidelity for metrology.

---

# 9. Open VLM replacement for Cal AI

## Qwen3-VL

https://github.com/QwenLM/Qwen3-VL

## InternVL

https://github.com/OpenGVLab/InternVL

Use an open VLM for:

$$
I
\rightarrow
\{
\text{dish},
\text{visible components},
\text{ingredient hypotheses},
\text{cooking clues}
\}.
$$

Force structured output.

Example:

```json
{
  "meal_name": "chicken biryani",
  "components": [
    {
      "name": "basmati rice",
      "confidence": 0.93
    },
    {
      "name": "chicken",
      "confidence": 0.96
    }
  ],
  "possible_hidden_ingredients": [
    "oil",
    "ghee"
  ],
  "preparation_hypotheses": [
    "spiced rice",
    "fried onions"
  ]
}
```

The schema should distinguish:

```text
observed
inferred
measured
retrieved
user_provided
```

That is much safer than treating every model output as fact.

---

# 10. Reproduce the Cal AI-style correction loop

A strong product pattern is:

$$
Y_0=F(I)
$$

then:

$$
Y_1=G(I,Y_0,e),
$$

where $e$ is the user's correction.

Example:

```text
Original image: meal.jpg

Previous prediction:
- rice: 250 g
- chicken: 100 g

Correction:
"There are two pieces of chicken."
```

The VLM receives:

- original image,
- previous structured prediction,
- user correction.

Save:

$$
(I,Y_0,e,Y_1)
$$

as a feedback record.

Over time:

$$
\boxed{
\text{usage}
\rightarrow
\text{corrections}
\rightarrow
\text{domain dataset}
\rightarrow
\text{specialist model}
}
$$

This is a reproducible version of the commercial data-flywheel strategy.

---

# 11. Nutrition retrieval

## USDA FoodData Central

API documentation:

https://fdc.nal.usda.gov/api-guide/

Use:

$$
\text{food identity}
\rightarrow
\text{database candidate}
\rightarrow
\text{verified nutrient values}.
$$

Do **not** rely on VLM parametric memory for precise nutrition values.

## Open Food Facts

Python SDK:

https://github.com/openfoodfacts/openfoodfacts-python

Use for:

- barcode products,
- branded foods,
- packaged-food ingredients,
- nutrition labels.

## Entity resolution

A vision model may output:

```text
chicken curry
```

while databases contain many related entities.

Resolve:

$$
d^\star
=
\arg\max_d
P(d\mid q,I,r,c)
$$

where:

- $q$ = text query,
- $I$ = image evidence,
- $r$ = geographic/cuisine context,
- $c$ = cooking/recipe context.

---

# 12. Nutrition equation

For $M$ identified food components:

$$
\boxed{
N_k
=
\sum_{j=1}^{M}
m_j\,n_{jk}
}
$$

where:

- $m_j$ = component mass in grams,
- $n_{jk}$ = nutrient $k$ per gram for component $j$.

For energy:

$$
\boxed{
E
=
\sum_j
m_j e_j
}
$$

with $e_j$ energy per gram from the selected nutrition entity.

For macronutrients:

$$
P=\sum_jm_jp_j,
\qquad
C=\sum_jm_jc_j,
\qquad
F=\sum_jm_jf_j.
$$

---

# 13. Proposed open architecture

```text
                         FOOD PHOTO
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       Semantic branch                Geometry branch
    Qwen3-VL / InternVL              detector / SAM 2
              │                             │
              ▼                             ├──────────────┐
       dish + components                    │              │
       ingredient hypotheses           RGB-only       sensor depth
       cooking clues                  metric depth     ARKit/ARCore
              │                          │              │
              │                          └──────┬───────┘
              │                                 │
              │                           metric depth
              │                                 │
              │                         AprilTag / token
              │                                 │
              │                         PnP + support plane
              │                                 │
              │                               volume
              │                                 │
              │                               density
              │                                 │
              │                                mass
              │                                 │
              └───────────────┐                 │
                              ▼                 ▼
                         ENTITY RESOLVER
                              │
                   ┌──────────┴───────────┐
                   │                      │
               USDA FDC           Open Food Facts
                   │                      │
                   └──────────┬───────────┘
                              │
                              ▼
                 calories / P / C / F
                              │
                              ▼
                     uncertainty model
                              │
               ┌──────────────┴─────────────┐
               │                            │
          high confidence             low confidence
               │                            │
               ▼                            ▼
            output                 active clarification
                                         │
                                         ▼
                                  correction loop
                                         │
                                         ▼
                                    training data
```

---

# 14. Baselines to implement

## B0 — VLM only

$$
I
\rightarrow
\text{VLM}
\rightarrow
\{\hat z,\hat m,\hat N\}.
$$

Purpose: approximate a simple AI calorie-photo product.

## B1 — VLM + database

$$
I
\rightarrow
\hat z
\rightarrow
\text{nutrition DB}
\rightarrow
\hat N.
$$

Use true mass first to isolate semantic/database error.

## B2 — VLM + learned metric depth

$$
I
\rightarrow
\begin{cases}
\text{VLM}\rightarrow \hat z\\
\text{SAM 2}\rightarrow S\\
\text{UniDepth/Metric3D}\rightarrow\hat D
\end{cases}
$$

then:

$$
(S,\hat D,\hat K)
\rightarrow
\hat V
\rightarrow
\hat m
\rightarrow
\hat N.
$$

## B3 — known plate

Use a plate with known physical diameter.

This reproduces an established metric prior.

## B4 — fiducial token

Use AprilTag/ArUco + PnP.

## B5 — RGB-D

Use actual phone depth.

## B6 — fiducial + guided multi-view

Use real multi-view geometry with common metric coordinates.

---

# 15. Datasets

## Nutrition5k

Repository:

https://github.com/google-research-datasets/Nutrition5k

Important labels include:

- RGB,
- RGB-D for subsets,
- multi-angle videos,
- ingredient identities,
- ingredient masses,
- total mass,
- calories,
- protein,
- carbohydrate,
- fat.

Use for:

- semantic baselines,
- RGB-D training,
- multi-view experiments,
- portion evaluation,
- nutrition regression,
- 3D→RGB distillation.

## MetaFood3D

Use for:

- 3D food representation,
- point-cloud/mesh learning,
- volume/portion research.

See the main project `DATASETS.md` for verified access details.

## ECUST Food Dataset

Historically important because it includes measured food properties and calibration/reference-object ideas.

It should be used as a direct prior-art baseline for:

$$
\boxed{
\text{reference object}+\text{food volume estimation}.
}
$$

## FoodSeg103

Use for:

- food-specific segmentation,
- YOLO/SAM training,
- mask evaluation.

---

# 16. Implementation roadmap

## Phase 0 — experiment harness

Define a canonical object:

```python
MealSample(
    rgb_paths=[],
    depth_paths=[],
    intrinsics=None,
    camera_poses=[],
    fiducial=None,
    ground_truth_mass_g=None,
    ground_truth_volume_ml=None,
    food_components=[],
    nutrition_ground_truth=None,
)
```

Every experiment should produce:

- prediction JSON,
- overlays,
- depth visualization,
- geometry output,
- errors,
- uncertainty,
- model/version metadata.

---

## Phase 1 — semantic baseline

Build:

```text
image
→ Qwen3-VL or InternVL
→ structured food JSON
→ USDA/Open Food Facts
→ nutrition
```

Initially provide **true mass**.

This measures semantic/database quality separately from geometry.

---

## Phase 2 — monocular geometry

Build:

```text
SAM 2
+
UniDepth / Metric3D
+
Open3D
→ volume
→ density
→ mass
```

Report volume and mass errors independently.

---

## Phase 3 — fiducial token

Prototype:

```text
rigid square card
side length ≈ 60 mm
AprilTag or ArUco
matte finish
high contrast
machine-readable ID
precisely measured geometry
```

Implement:

```text
detect marker
→ solvePnP
→ support plane
→ metric footprint
→ align depth
→ volume
```

---

## Phase 4 — iOS RGB-D capture

Collect:

```text
RGB
depth
confidence
intrinsics
pose
fiducial pose
timestamp
device metadata
```

Validate using known physical objects before food.

---

## Phase 5 — guided multi-view

Ask the user to move around the meal.

Use:

- ARKit/ARCore camera poses,
- SAM 2 video masks,
- point-cloud fusion,
- optional COLMAP/OpenMVS benchmark.

Test:

$$
N\in\{1,2,3,5,10,\text{video}\}.
$$

---

## Phase 6 — density model

Instead of fixed density:

$$
\rho_z=\text{constant},
$$

learn or retrieve:

$$
p(\rho\mid z,r,s).
$$

Evaluate cooking-state sensitivity.

---

## Phase 7 — specialist multimodal model

Train on:

- Nutrition5k,
- MetaFood3D,
- ECUSTFD,
- new globally diverse measured data,
- correction logs.

Possible output:

$$
(I,D,T,\text{metadata})
\rightarrow
(z,V,m,N,\sigma).
$$

---

## Phase 8 — 3D→RGB distillation

Train a geometry-aware teacher:

$$
T(I,D,P)
$$

then distill into:

$$
S(I).
$$

Goal:

$$
E(S_{\text{3D-distilled}})
<
E(S_{\text{RGB-only}}).
$$

---

# 17. Evaluation and ablations

## Relative volume error

$$
\boxed{
E_V=\frac{|\hat V-V|}{V}
}
$$

## Relative mass error

$$
\boxed{
E_m=\frac{|\hat m-m|}{m}
}
$$

## Relative calorie error

$$
\boxed{
E_C=
\frac{|\widehat C-C|}{C}
}
$$

Also report:

- MAE,
- MAPE,
- median absolute percentage error,
- RMSE,
- 90th-percentile error,
- confidence interval coverage,
- calibration error.

### Required ablations

| Experiment | What it isolates |
|---|---|
| VLM only | learned priors |
| VLM + DB | nutrition grounding |
| learned metric depth | monocular geometry |
| known plate | weak metric reference |
| fiducial | explicit metric reference |
| RGB-D | real depth |
| multi-view | real parallax |
| fiducial + multi-view | maximum geometric constraints |
| true identity + predicted mass | geometry error |
| predicted identity + true mass | semantic error |
| true identity + true mass | database/recipe error |
| oracle segmentation | mask error |
| oracle depth | depth error |
| generated novel views | learned prior contribution |
| real novel views | true added information |

---

# 18. Commercial black-box benchmark

Run the same measured meals through:

- Cal AI,
- SnapCalorie,
- Foodvisor,
- MyFitnessPal Meal Scan,
- other available calorie-photo apps.

Suggested controlled tests:

| Experiment | What it reveals |
|---|---|
| camera distances 30/45/60/90 cm | sensitivity to apparent scale |
| small vs large plate | plate-size prior |
| uploaded image vs live scan | sensor dependence |
| LiDAR vs non-LiDAR device | hardware-depth effect |
| EXIF preserved vs stripped | metadata dependence |
| original vs crop | scale/context heuristics |
| one vs multiple views | parallax benefit |
| marker visible vs absent | response to explicit scale cues |
| visible ingredients vs blended food | semantic ambiguity |
| added text about oil/sauce | value of side information |
| repeat same scan | stochasticity |

This benchmark can be valuable even without access to proprietary source code.

---

# 19. Uncertainty-aware output

Do not output only:

```text
742 kcal
```

Prefer:

```text
Calories: 742 kcal
95% plausible interval: 590–910 kcal

Main uncertainty sources:
- hidden cooking oil
- rice mass
- sauce composition
```

A simplified uncertainty model is:

$$
\sigma_N^2
\approx
\sigma_{\text{identity}}^2
+
\sigma_{\text{segmentation}}^2
+
\sigma_{\text{depth}}^2
+
\sigma_{\text{volume}}^2
+
\sigma_{\text{density}}^2
+
\sigma_{\text{recipe}}^2
+
\sigma_{\text{database}}^2.
$$

Use active clarification when one term dominates.

---

# 20. Recommended repository layout

```text
food-vision-calorie-estimation/
├── README.md
├── OPEN_SOURCE_IMPLEMENTATIONS.md
├── DATASETS.md
├── MODELS_REPOS.md
├── REFERENCES.md
├── ROADMAP.md
│
├── configs/
│   ├── vlm_only.yaml
│   ├── monocular_depth.yaml
│   ├── fiducial.yaml
│   ├── rgbd.yaml
│   └── multiview.yaml
│
├── src/
│   ├── capture/
│   │   ├── ios/
│   │   └── android/
│   ├── segmentation/
│   ├── recognition/
│   ├── depth/
│   ├── geometry/
│   │   ├── fiducial.py
│   │   ├── pnp.py
│   │   ├── plane.py
│   │   ├── pointcloud.py
│   │   ├── volume.py
│   │   └── multiview.py
│   ├── nutrition/
│   │   ├── usda.py
│   │   ├── openfoodfacts.py
│   │   ├── density.py
│   │   └── entity_resolver.py
│   ├── uncertainty/
│   └── pipeline/
│       ├── quick_scan.py
│       └── precision_scan.py
│
├── experiments/
│   ├── semantic_oracle_mass/
│   ├── depth_comparison/
│   ├── fiducial_ablation/
│   ├── rgbd_ablation/
│   ├── multiview_ablation/
│   ├── density_ablation/
│   └── commercial_blackbox/
│
├── notebooks/
└── tests/
```

---

# 21. Licensing checklist

Before using any repository in a distributable application, verify:

1. source-code license,
2. model-weight license,
3. dataset license,
4. commercial-use restrictions,
5. attribution requirements,
6. redistribution rights,
7. API terms.

A public GitHub repository is **not automatically reusable**.

In particular, re-check licenses for research repositories such as MFP3D, PortionNet, and FoodLens before copying their code into a released product.

---

# 22. Immediate implementation backlog

- [ ] Reproduce `Nutrition-Estimation-via-Segmentation-and-Depth`.
- [ ] Port the AlexGraikos geometry code.
- [ ] Add SAM 2 segmentation.
- [ ] Add UniDepth.
- [ ] Add Metric3D.
- [ ] Add Depth Anything V2 comparison.
- [ ] Implement AprilTag/ArUco detection.
- [ ] Implement OpenCV `solvePnP`.
- [ ] Implement support-plane fitting.
- [ ] Add Open3D point-cloud back-projection.
- [ ] Implement volume integration.
- [ ] Add food-density database.
- [ ] Add USDA FoodData Central client.
- [ ] Add Open Food Facts client.
- [ ] Add Qwen3-VL structured output.
- [ ] Add InternVL comparison.
- [ ] Implement Cal-AI-style correction loop.
- [ ] Create experiment metadata schema.
- [ ] Collect 20–50 measured pilot meals.
- [ ] Run monocular/fiducial/RGB-D/multi-view ablation.
- [ ] Publish the first reproducible benchmark.

---

# 23. Most useful links

## Food-specific implementations

- Nutrition Estimation via Segmentation and Depth  
  https://github.com/anhlehong/Nutrition-Estimation-via-Segmentation-and-Depth
- Food Volume Estimation  
  https://github.com/AlexGraikos/food_volume_estimation
- MFP3D  
  https://github.com/jingema99/MFP3D
- PortionNet  
  https://github.com/darrinbright/PortionNet
- FoodLens  
  https://github.com/porpita1342/FoodLens
- Classical reference-object example  
  https://github.com/vinayaksable2399/Food-Calories-Estimation-Using-Image-Processing

## Segmentation

- SAM 2  
  https://github.com/facebookresearch/sam2
- FoodSAM  
  https://github.com/jamesjg/FoodSAM
- Ultralytics  
  https://github.com/ultralytics/ultralytics

## Depth

- UniDepth  
  https://github.com/lpiccinelli-eth/UniDepth
- Metric3D  
  https://github.com/YvanYin/Metric3D
- Depth Anything V2  
  https://github.com/DepthAnything/Depth-Anything-V2

## Geometry

- OpenCV  
  https://github.com/opencv/opencv
- OpenCV PnP  
  https://docs.opencv.org/4.x/d5/d1f/calib3d_solvePnP.html
- OpenCV ArUco  
  https://docs.opencv.org/4.x/d5/dae/tutorial_aruco_detection.html
- Open3D  
  https://github.com/isl-org/Open3D

## Multi-view / 3D

- COLMAP  
  https://github.com/colmap/colmap
- OpenMVS  
  https://github.com/cdcseacave/openMVS
- Nerfstudio  
  https://github.com/nerfstudio-project/nerfstudio
- 3D Gaussian Splatting  
  https://github.com/graphdeco-inria/gaussian-splatting

## VLMs

- Qwen3-VL  
  https://github.com/QwenLM/Qwen3-VL
- InternVL  
  https://github.com/OpenGVLab/InternVL

## Nutrition databases

- USDA FoodData Central API  
  https://fdc.nal.usda.gov/api-guide/
- Open Food Facts Python SDK  
  https://github.com/openfoodfacts/openfoodfacts-python

## Dataset

- Nutrition5k  
  https://github.com/google-research-datasets/Nutrition5k

## Phone depth

- Apple ARKit scene depth  
  https://developer.apple.com/documentation/arkit/arframe/scenedepth
- Apple AVDepthData  
  https://developer.apple.com/documentation/avfoundation/avdepthdata
- Google ARCore Depth  
  https://developers.google.com/ar/develop/depth

---

# 24. Final recommendation

The strongest initial open implementation is:

$$
\boxed{
\text{VLM semantics}
+
\text{SAM 2}
+
\text{metric depth}
+
\text{AprilTag/ArUco}
+
\text{OpenCV PnP}
+
\text{Open3D volume}
+
\text{density model}
+
\text{USDA/Open Food Facts}
+
\text{uncertainty-aware correction}
}
$$

The higher-accuracy research version becomes:

$$
\boxed{
\text{guided real multi-view}
+
\text{RGB-D}
+
\text{metric token}
+
\text{3D-aware teacher}
+
\text{RGB-only distillation}
}
$$

The important contribution is not another photo-calorie demo. It is a reproducible system that determines **which measurements actually reduce final nutrition error**, how much they help, and where uncertainty remains.
