import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { StudyWorkspace } from "@/components/study-workspace";

describe("workspace account header", () => {
  test("offers sign-in to guests without showing a profile or preview badge", () => {
    const markup = renderToStaticMarkup(<StudyWorkspace />);

    expect(markup).toContain('href="/auth/sign-in"');
    expect(markup).toContain("Sign in");
    expect(markup).not.toContain("UI preview");
    expect(markup).not.toContain("Account for");
  });

  test("shows the account action for a signed-in viewer", () => {
    const markup = renderToStaticMarkup(
      <StudyWorkspace viewer={{ id: "student-1", displayName: "Maya Chen" }} />,
    );

    expect(markup).toContain("Account for Maya Chen");
    expect(markup).not.toContain('href="/auth/sign-in"');
  });

  test("renders the workspace resizable panel layout with notebook title", () => {
    const markup = renderToStaticMarkup(
      <StudyWorkspace notebookTitle="Machine Learning Basics" />,
    );

    expect(markup).toContain("Machine Learning Basics");
    expect(markup).toContain('id="library-panel"');
    expect(markup).toContain('id="chat-panel"');
    expect(markup).toContain('id="source-panel"');
    expect(markup).not.toContain("onCollapse=");
    expect(markup).not.toContain("onExpand=");
  });
});
