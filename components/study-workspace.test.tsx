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
});
