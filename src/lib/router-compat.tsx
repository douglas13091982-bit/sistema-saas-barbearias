// Thin adapter so the imported screens keep their original navigation API on TanStack Router.
// @ts-nocheck -- loose adapter types
import {
  Link as TLink,
  Outlet,
  useNavigate as useTNavigate,
  useLocation,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode, type MouseEventHandler } from "react";

type LinkProps = {
  to: string;
  className?: string;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  style?: React.CSSProperties;
};

function split(to: string) {
  const [path, query] = to.split("?");
  const search: Record<string, string> = {};
  if (query) new URLSearchParams(query).forEach((v, k) => (search[k] = v));
  return { path, search };
}

function scopedPath(to: string, pathname: string) {
  const segment=pathname.split('/')[1];
  const reserved=['admin','super-admin','cadastro','agendar','confirmacao','api',''];
  if(!reserved.includes(segment) && (to==='/' || to.startsWith('/agendar') || to.startsWith('/confirmacao/'))) return '/'+segment+(to==='/'?'':to);
  return to;
}
export function Link({ to, ...rest }: LinkProps) {
  const pathname=useRouterState({select:s=>s.location.pathname});
  const { path, search } = split(scopedPath(to,pathname));
  return <TLink to={path as never} search={search as never} {...rest} />;
}

export function NavLink({
  to,
  className,
  ...rest
}: Omit<LinkProps, "className"> & {
  className?: string | ((s: { isActive: boolean }) => string);
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = pathname === to || pathname.startsWith(to + "/");
  const cls = typeof className === "function" ? className({ isActive }) : className;
  return <Link to={to} className={cls} {...rest} />;
}

export function useNavigate() {
  const nav = useTNavigate();
  const pathname=useRouterState({select:s=>s.location.pathname});
  return (to: string, opts?: { replace?: boolean }) => {
    const { path, search } = split(scopedPath(to,pathname));
    nav({ to: path as never, search: search as never, replace: opts?.replace });
  };
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [to]);
  return null;
}

export function useSearchParams(): [URLSearchParams] {
  const location = useLocation();
  return [new URLSearchParams(location.searchStr ?? "")];
}

export { Outlet };
