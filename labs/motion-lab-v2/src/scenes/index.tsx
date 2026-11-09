import { memo, type ComponentType } from "react";
import { SceneProvider } from "./kit";
import { Kitchen, KITCHEN_STAGES } from "./Kitchen";
import { Living, LIVING_STAGES } from "./Living";
import { Restaurant, RESTAURANT_STAGES } from "./Restaurant";

export type SceneId = "kitchen" | "living" | "restaurant";
export type Stage = { title: string; text: string };
export type SceneDef = {
  id: SceneId;
  title: string;
  kind: string;
  stages: Stage[];
  Comp: ComponentType;
  /** Кадрирование для узкого экрана: тот же кадр и та же камера, только обрезка по ширине. */
  mobileView: string;
  demo: true;
};

export const SCENES: SceneDef[] = [
  { id: "kitchen", title: "Кухня", kind: "Кухня с островом", stages: KITCHEN_STAGES, Comp: Kitchen, mobileView: "650 0 720 900", demo: true },
  { id: "living", title: "Гостиная", kind: "Гостиная с медиастеной", stages: LIVING_STAGES, Comp: Living, mobileView: "440 0 720 900", demo: true },
  { id: "restaurant", title: "Ресторан", kind: "Зал ресторана с баром", stages: RESTAURANT_STAGES, Comp: Restaurant, mobileView: "440 0 720 900", demo: true },
];
export const sceneById = (id: SceneId) => SCENES.find((s) => s.id === id)!;

type ViewProps = { scene: SceneDef; p: number; hold: number; reduced: boolean; uid: string; mobile: boolean };

/** Сцена в заданный момент прогресса. Чистая функция от p — поэтому прокрутка назад разбирает интерьер. */
export const SceneView = memo(function SceneView({ scene, p, hold, reduced, uid, mobile }: ViewProps) {
  const { Comp } = scene;
  return (
    <svg
      className="scene-svg"
      viewBox={mobile ? scene.mobileView : "0 0 1600 900"}
      preserveAspectRatio={mobile ? "xMidYMid slice" : "xMidYMid meet"}
      role="img"
      aria-label={`${scene.kind}: демонстрационная сцена сборки`}
    >
      <SceneProvider value={{ p, N: scene.stages.length, hold, reduced, uid }}>
        <Comp />
      </SceneProvider>
    </svg>
  );
});
