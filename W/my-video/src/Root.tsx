import { Composition } from "remotion";
import { MyVideo } from "./MyVideo";
import { TutorialVideo } from "./TutorialVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TutorialVideo"
        component={TutorialVideo}
        durationInFrames={2500}
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  );
};
