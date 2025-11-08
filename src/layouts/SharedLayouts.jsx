import { Outlet } from "react-router";
import Navbar from "../components/Navbar";

function SharedLayouts() {
  return (
    <>
      <Navbar />
      <div className="pt-20">
        <Outlet />
      </div>
    </>
  );
}

export default SharedLayouts;
