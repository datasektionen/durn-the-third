import React, { useEffect } from "react";
import {
  useParams,
  useNavigate,
} from "react-router-dom";

export const Login: React.FC = () => {
  const callback = encodeURIComponent(`${window.location.origin}/#/token/`)
  const url = `${process.env.LOGIN_URL}/login?callback=${callback}`;
  window.location.replace(url);
  return <div />;
}

export const Logout: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
    window.location.reload();
  }, []);
  return <div />;
}

export const Token: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.setItem("token", token as string);
    navigate("/", { replace: true });
  }, []);
  return <div />;
}