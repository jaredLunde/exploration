// This file is for setting up Jest test environments
import "@testing-library/jest-dom/extend-expect";

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
