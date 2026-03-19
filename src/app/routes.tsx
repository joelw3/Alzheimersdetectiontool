import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { PatientInfo } from "./pages/PatientInfo";
import { Instructions } from "./pages/Instructions";
import { PreSurvey } from "./pages/PreSurvey";
import { ListenStory } from "./pages/ListenStory";
import { ImmediateRecall } from "./pages/ImmediateRecall";
import { DelayedRecall } from "./pages/DelayedRecall";
import { Results } from "./pages/Results";
import { Dashboard } from "./pages/Dashboard";
import Root from "./Root";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "patient-info", Component: PatientInfo },
      { path: "instructions", Component: Instructions },
      { path: "pre-survey", Component: PreSurvey },
      { path: "listen", Component: ListenStory },
      { path: "immediate-recall", Component: ImmediateRecall },
      { path: "delayed-recall", Component: DelayedRecall },
      { path: "results", Component: Results },
      { path: "dashboard", Component: Dashboard },
    ],
  },
]);