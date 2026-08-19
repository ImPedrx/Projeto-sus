import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library only auto-registers its cleanup when Vitest globals are on.
// This suite imports describe/it explicitly, so unmount between tests by hand —
// otherwise a second render leaves two copies of the same form in the document.
afterEach(cleanup);
