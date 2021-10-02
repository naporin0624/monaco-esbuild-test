import axios from "axios";

window.loadcss = async (url: string) => {
  if (document.getElementById(url)) return;

  const content = await axios.get<string>(url).then((res) => res.data);
  const style = document.createElement("style");
  style.id = url;
  style.innerHTML = content;

  document.head.appendChild(style);
};
