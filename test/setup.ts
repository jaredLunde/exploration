// This file is for setting up Jest test environments
import "@testing-library/jest-dom/extend-expect";
import { clearRequestTimeout } from "@essentials/request-timeout";

afterEach(() => {
  jest.clearAllMocks();
});

jest.useFakeTimers();

window.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

window.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

jest.mock("@essentials/request-timeout", () => ({
  default: window.setTimeout,
  requestTimeout: window.setTimeout,
  clearRequestTimeout: window.clearTimeout,
}));
