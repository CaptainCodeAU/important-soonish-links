import "../styles/global.css";
import { mount } from "svelte";
import App from "../components/App.svelte";

const savedTheme = localStorage.getItem("isl_theme") ?? "system";
if (savedTheme === "dark" || (savedTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  document.documentElement.setAttribute("data-theme", "dark");
}

mount(App, { target: document.body });
