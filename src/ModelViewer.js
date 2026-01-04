import React, { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import styled, { createGlobalStyle } from "styled-components";

/* ================= TRANSLATIONS ================= */
const translations = {
  en: {
    title: "3D Model Viewer",
    webInstructions: "• Drag to rotate • Scroll to zoom • Right-click to pan",
    arButtonHint: " ",
    arModeTitle: "AR Mode Active",
    arPlacement: "• Move your device to find a surface",
    arTap: "• Tap the blue reticle to place the model",
    arGestures: "• Use gestures to scale, rotate, and move",
    modelPlaced: "Model Placed",
    moveModel: "• Drag with 1 finger to move",
    scaleModel: "• Pinch with 2 fingers to scale",
    rotateModel: "• Rotate with 2 fingers to rotate",
    loading: "Loading 3D Model...",
    startAR: "Start AR",
    stopAR: "Stop AR",
    language: "Language",
    arNotSupported: "AR Not Supported",
    enterAR: "Enter Augmented Reality mode",
    exitAR: "Exit AR mode",
  },
  ru: {
    title: "3D Просмотрщик Моделей",
    webInstructions:
      "• Перетащите для вращения • Скролл для масштаба • ПКМ для перемещения",
    arButtonHint: " ",
    arModeTitle: "AR Режим Активен",
    arPlacement: "• Перемещайте устройство для поиска поверхности",
    arTap: "• Нажмите на синий прицел для размещения модели",
    arGestures:
      "• Используйте жесты для масштабирования, вращения и перемещения",
    modelPlaced: "Модель Размещена",
    moveModel: "• Перетаскивание 1 пальцем - перемещение",
    scaleModel: "• Сведение 2 пальцев - масштабирование",
    rotateModel: "• Вращение 2 пальцами - поворот",
    loading: "Загрузка 3D Модели...",
    startAR: "Начать AR",
    stopAR: "Остановить AR",
    language: "Язык",
    arNotSupported: "AR Не Поддерживается",
    enterAR: "Войти в режим дополненной реальности",
    exitAR: "Выйти из AR режима",
  },
  uz: {
    title: "3D Model Ko'ruvchi",
    webInstructions:
      "• Aylantirish uchun torting • Zoom uchun scroll qiling • Pan uchun o'ng tugma",
    arButtonHint: " ",
    arModeTitle: "AR Rejimi Faol",
    arPlacement: "• Sirt topish uchun qurilmani harakatlantiring",
    arTap: "• Modelni joylashtirish uchun ko'k nishanga teging",
    arGestures:
      "• O'lcham, aylantirish va ko'chirish uchun imolardan foydalaning",
    modelPlaced: "Model Joylashtirildi",
    moveModel: "• 1 barmoq bilan tortish - ko'chirish",
    scaleModel: "• 2 barmoq bilan siqish - o'lcham o'zgartirish",
    rotateModel: "• 2 barmoq bilan aylantirish - burish",
    loading: "3D Model Yuklanmoqda...",
    startAR: "AR ni Boshlash",
    stopAR: "AR ni To'xtatish",
    language: "Til",
    arNotSupported: "AR Qo'llab-quvvatlanmaydi",
    enterAR: "Kengaytirilgan haqiqat rejimiga kirish",
    exitAR: "AR rejimidan chiqish",
  },
};

/* ================= GLOBAL STYLES ================= */
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background: #f5f5f5;
    overflow: hidden;
    touch-action: none;
  }
  
  canvas {
    display: block;
    outline: none;
  }
`;

/* ================= CONTAINERS ================= */
const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: relative;
`;

const ModelViewerContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: opacity 0.3s ease;
  opacity: ${(props) => (props.show ? 1 : 0)};
  pointer-events: ${(props) => (props.show ? "all" : "none")};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

/* ================= BUTTONS ================= */
const ControlButton = styled.button`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-weight: 600;
  letter-spacing: 0.5px;
  z-index: 50;
  padding: 16px 40px;
  border-radius: 50px;
  font-size: 16px;
  min-width: 160px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

  &:hover:not(:disabled) {
    transform: translateX(-50%) translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateX(-50%) translateY(0px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StartARButton = styled(ControlButton)`
  background: linear-gradient(135deg, #007aff, #0056cc);

  &::before {
    font-size: 18px;
    margin-right: 10px;
  }
`;

const StopARButton = styled(ControlButton)`
  background: linear-gradient(135deg, #ff3b30, #cc2e25);
  box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);

  &::before {
    content: "✕";
    font-size: 18px;
    margin-right: 10px;
    font-weight: bold;
  }
`;

const LanguageButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover {
    background: rgba(0, 0, 0, 0.95);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0px);
  }

  &::after {
    content: "🌐";
    font-size: 14px;
  }
`;

const LanguageDropdown = styled.div`
  position: fixed;
  top: 70px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 100;
  overflow: hidden;
  min-width: 120px;
  opacity: ${(props) => (props.show ? 1 : 0)};
  transform: translateY(${(props) => (props.show ? "0" : "-10px")});
  pointer-events: ${(props) => (props.show ? "all" : "none")};
  transition: all 0.2s ease;
`;

const LanguageOption = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #333;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 122, 255, 0.1);
  }

  &.active {
    background: rgba(0, 122, 255, 0.15);
    color: #007aff;
    font-weight: 500;
  }

  &::after {
    content: ${(props) => (props.active ? '"✓"' : '""')};
    color: #007aff;
    font-weight: bold;
  }
`;

const InfoPanel = styled.div`
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 12px;
  font-size: 14px;
  color: #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  pointer-events: none;

  h3 {
    margin-bottom: 8px;
    color: #007aff;
  }

  p {
    margin-bottom: 4px;
    opacity: 0.8;
  }
`;

/* ================= 3D MODEL COMPONENT ================= */
function Model3D({
  url,
  isAR = false,
  arPosition = null,
  arScale = 0.3,
  arRotationY = 0,
  onLoad,
}) {
  const { scene, loading } = useGLTF(url);
  const modelRef = useRef();

  useEffect(() => {
    if (scene && !loading) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      scene.position.x = -center.x;
      scene.position.y = -center.y;
      scene.position.z = -center.z;

      if (!isAR) {
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim;
        scene.scale.setScalar(scale);
      }

      if (onLoad) onLoad(scene);
    }
  }, [scene, loading, isAR, onLoad]);

  useFrame(() => {
    if (modelRef.current && !isAR) {
      modelRef.current.rotation.y += 0.002;
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={scene}
      position={isAR ? arPosition : [0, 0, 0]}
      scale={isAR ? [arScale, arScale, arScale] : [1, 1, 1]}
      rotation={[0, isAR ? arRotationY : 0, 0]}
    />
  );
}

/* ================= AR RETICLE ================= */
function ARReticle({ onPlaceModel }) {
  const reticleRef = useRef();
  const hitTestSource = useRef(null);
  const sessionRef = useRef(null);
  const { gl } = useThree();

  useFrame((state, frame) => {
    if (!frame) return;

    const session = gl.xr.getSession();
    const referenceSpace = gl.xr.getReferenceSpace();

    if (session !== sessionRef.current) {
      sessionRef.current = session;

      if (session) {
        session.requestReferenceSpace("viewer").then((space) => {
          session.requestHitTestSource({ space }).then((source) => {
            hitTestSource.current = source;
          });
        });
      }
    }

    if (hitTestSource.current && reticleRef.current) {
      const hitTestResults = frame.getHitTestResults(hitTestSource.current);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);

        reticleRef.current.visible = true;
        reticleRef.current.matrix.fromArray(pose.transform.matrix);
      } else {
        reticleRef.current.visible = false;
      }
    }
  });

  return (
    <mesh
      ref={reticleRef}
      visible={false}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (!reticleRef.current.visible) return;

        const position = new THREE.Vector3();
        position.setFromMatrixPosition(reticleRef.current.matrix);

        onPlaceModel(position);
      }}
    >
      <ringGeometry args={[0.05, 0.1, 32]} />
      <meshBasicMaterial color="#007aff" transparent opacity={0.8} />
    </mesh>
  );
}

/* ================= AR SESSION MANAGER ================= */
function ARSessionManager({ onSessionStart, onSessionEnd }) {
  const { gl } = useThree();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      if ("xr" in navigator) {
        try {
          const supported = await navigator.xr.isSessionSupported(
            "immersive-ar"
          );
          setIsSupported(supported);
        } catch (err) {
          console.warn("WebXR check failed:", err);
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    gl.xr.enabled = true;

    const handleSessionStart = () => {
      if (onSessionStart) onSessionStart();
    };

    const handleSessionEnd = () => {
      if (onSessionEnd) onSessionEnd();
    };

    gl.xr.addEventListener("sessionstart", handleSessionStart);
    gl.xr.addEventListener("sessionend", handleSessionEnd);

    return () => {
      gl.xr.removeEventListener("sessionstart", handleSessionStart);
      gl.xr.removeEventListener("sessionend", handleSessionEnd);
    };
  }, [gl, isSupported, onSessionStart, onSessionEnd]);

  return null;
}

/* ================= LANGUAGE CONTEXT ================= */
const LanguageContext = React.createContext({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

/* ================= MAIN COMPONENT ================= */
export default function ModelViewer() {
  // Language state
  const [language, setLanguage] = useState("en");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isStartingAR, setIsStartingAR] = useState(false);

  // Translation function
  const t = useCallback(
    (key) => {
      return translations[language]?.[key] || translations.en[key] || key;
    },
    [language]
  );

  // Model configuration
  const [modelUrl, setModelUrl] = useState("/models/model.glb");
  const [isLoading, setIsLoading] = useState(true);

  // AR state
  const [isARActive, setIsARActive] = useState(false);
  const [arModelPosition, setArModelPosition] = useState(null);
  const [arScale, setArScale] = useState(0.3);
  const [arRotationY, setArRotationY] = useState(0);
  const [isARSupported, setIsARSupported] = useState(false);

  // References
  const arButtonRef = useRef(null);

  /* ================= MODEL LOADING ================= */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modelParam = params.get("model");
    const langParam = params.get("lang");

    if (langParam && ["en", "ru", "uz"].includes(langParam)) {
      setLanguage(langParam);
    }

    if (modelParam) {
      const isAbsolute =
        modelParam.startsWith("http://") || modelParam.startsWith("https://");
      setModelUrl(isAbsolute ? modelParam : `/models/${modelParam}`);
    }

    // Initialize WebXR
    const initWebXR = async () => {
      if ("xr" in navigator) {
        try {
          const supported = await navigator.xr.isSessionSupported(
            "immersive-ar"
          );
          setIsARSupported(supported);

          if (supported) {
            const renderer = new THREE.WebGLRenderer({
              antialias: true,
              alpha: true,
            });
            renderer.xr.enabled = true;

            const button = ARButton.createButton(renderer, {
              requiredFeatures: ["hit-test"],
              optionalFeatures: ["dom-overlay"],
              domOverlay: { root: document.body },
            });

            button.style.display = "none";
            button.id = "webxr-ar-button";
            button.setAttribute("aria-hidden", "true");
            document.body.appendChild(button);
            arButtonRef.current = button;
            button.style.position = "fixed";
            button.style.bottom = "-1000px";
            button.style.left = "-1000px";
            button.style.opacity = "0";
            button.style.pointerEvents = "none";
          }
        } catch (err) {
          console.warn("WebXR initialization failed:", err);
        }
      }
    };

    initWebXR();

    return () => {
      if (arButtonRef.current) {
        document.body.removeChild(arButtonRef.current);
        arButtonRef.current = null;
      }
    };
  }, []);

  /* ================= AR CONTROLS ================= */
  const startARSession = useCallback(() => {
    if (arButtonRef.current && isARSupported) {
      setIsStartingAR(true); // ⬅️ MUHIM
      arButtonRef.current.click();
    }
  }, [isARSupported]);

  const handleARSessionStart = useCallback(() => {
    setIsARActive(true);
    setIsStartingAR(false);
    setArModelPosition(null);
  }, []);

  const handleARSessionEnd = useCallback(() => {
    setIsARActive(false);
  }, []);

  const stopARSession = useCallback(() => {
    // Refresh the page to return to initial state
    window.location.reload();
  }, []);

  const placeModelInAR = useCallback((position) => {
    setArModelPosition(position);
  }, []);

  /* ================= GESTURE HANDLING ================= */
  useEffect(() => {
    if (!isARActive || !arModelPosition) return;

    const handleTouchStart = (e) => {
      if (!arModelPosition) return;

      if (e.touches.length === 1) {
        // Single touch - prepare for dragging
        const startTouch = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          position: arModelPosition.clone(),
        };
        e.target._startTouch = startTouch;
      } else if (e.touches.length === 2) {
        // Two touches - prepare for scaling and rotation
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;

        e.target._startDistance = Math.sqrt(dx * dx + dy * dy);
        e.target._startAngle = Math.atan2(dy, dx);
        e.target._startScale = arScale;
        e.target._startRotation = arRotationY;
      }
    };

    const handleTouchMove = (e) => {
      if (!arModelPosition) return;

      if (e.touches.length === 1 && e.target._startTouch) {
        const touch = e.touches[0];
        const deltaX = (touch.clientX - e.target._startTouch.x) * 0.002;
        const deltaZ = (touch.clientY - e.target._startTouch.y) * 0.002;

        const newPosition = e.target._startTouch.position.clone();
        newPosition.x += deltaX;
        newPosition.z += deltaZ;

        setArModelPosition(newPosition);
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const currentAngle = Math.atan2(dy, dx);

        if (e.target._startDistance !== undefined) {
          const scaleDelta =
            (currentDistance - e.target._startDistance) * 0.001;
          const newScale = Math.max(
            0.1,
            Math.min(2.0, e.target._startScale + scaleDelta)
          );
          setArScale(newScale);
        }

        if (e.target._startAngle !== undefined) {
          const rotationDelta = currentAngle - e.target._startAngle;
          setArRotationY(e.target._startRotation + rotationDelta);
        }
      }
    };

    const handleTouchEnd = (e) => {
      // e parametrini qo'shdik
      // Clean up
      if (e.target) {
        delete e.target._startTouch;
        delete e.target._startDistance;
        delete e.target._startAngle;
        delete e.target._startScale;
        delete e.target._startRotation;
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isARActive, arModelPosition, arScale, arRotationY]);

  /* ================= LANGUAGE HANDLERS ================= */
  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang);
    setShowLanguageDropdown(false);

    // Update URL without reloading
    const url = new URL(window.location);
    url.searchParams.set("lang", lang);
    window.history.pushState({}, "", url);
  }, []);

  const languageOptions = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "uz", name: "O'zbekcha", flag: "🇺🇿" },
  ];

  const isModelPlacedInAR = arModelPosition !== null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <GlobalStyle />
      <AppContainer>
        <ModelViewerContainer>
          <Canvas
            camera={{ position: [0, 2, 5], fov: 50 }}
            gl={{
              antialias: true,
              alpha: true,
              preserveDrawingBuffer: true,
            }}
            shadows
          >
            <ARSessionManager
              onSessionStart={handleARSessionStart}
              onSessionEnd={handleARSessionEnd}
            />

            <ambientLight intensity={0.8} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />

            {!isARActive && <Environment preset="city" />}

            {isARActive && <ARReticle onPlaceModel={placeModelInAR} />}

            <Model3D
              url={modelUrl}
              isAR={isARActive && isModelPlacedInAR}
              arPosition={arModelPosition}
              arScale={arScale}
              arRotationY={arRotationY}
              onLoad={() => setIsLoading(false)}
            />

            {!isARActive && (
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={1}
                maxDistance={10}
                autoRotate={!isARActive}
                autoRotateSpeed={0.5}
              />
            )}
          </Canvas>

          {/* Loading Overlay */}
          <LoadingOverlay show={isLoading}>
            <LoadingSpinner />
            <p style={{ color: "#666", fontSize: 14 }}>{t("loading")}</p>
          </LoadingOverlay>

          {/* Info Panel - Web Mode */}
          {!isARActive && (
            <InfoPanel>
              <h3>{t("title")}</h3>
              <p>{t("webInstructions")}</p>
              <p>{t("arButtonHint")}</p>
            </InfoPanel>
          )}

          {/* Info Panel - AR Mode (No Model Placed) */}
          {isARActive && !isModelPlacedInAR && (
            <InfoPanel>
              <h3>{t("arModeTitle")}</h3>
              <p>{t("arPlacement")}</p>
              <p>{t("arTap")}</p>
              <p>{t("arGestures")}</p>
            </InfoPanel>
          )}

          {/* Info Panel - AR Mode (Model Placed) */}
          {isARActive && isModelPlacedInAR && (
            <InfoPanel>
              <h3>{t("modelPlaced")}</h3>
              <p>{t("moveModel")}</p>
              <p>{t("scaleModel")}</p>
              <p>{t("rotateModel")}</p>
            </InfoPanel>
          )}

          {/* Language Selector */}
          <LanguageButton
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            aria-label={t("language")}
          >
            {language.toUpperCase()}
          </LanguageButton>

          <LanguageDropdown show={showLanguageDropdown}>
            {languageOptions.map((option) => (
              <LanguageOption
                key={option.code}
                className={language === option.code ? "active" : ""}
                onClick={() => handleLanguageChange(option.code)}
              >
                <span>
                  {option.flag} {option.name}
                </span>
              </LanguageOption>
            ))}
          </LanguageDropdown>

          {/* AR Button - Only ONE button shown at a time */}
          {!isARActive && !isStartingAR && (
            <StartARButton onClick={startARSession} disabled={!isARSupported}>
              {t("startAR")}
            </StartARButton>
          )}
        </ModelViewerContainer>
      </AppContainer>
    </LanguageContext.Provider>
  );
}
