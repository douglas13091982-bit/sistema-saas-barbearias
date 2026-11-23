// Thin adapter so the imported screens keep their original navigation API on TanStack Router.
// @ts-nocheck -- loose adapter types
import {
  Link as TLink,
  Outlet,
  useNavigate as useTNavigate,
  useSearch,
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
  const [url, hash] = to.split("#", 2);
  const [path, query] = url.split("?", 2);
  const search: Record<string, string> = {};
  if (query) new URLSearchParams(query).forEach((v, k) => (search[k] = v));
  return { path, search, hash };
}

function scopedPath(to: string, pathname: string) {
  const segment=pathname.split('/')[1];
  const reserved=['admin','super-admin','cadastro','agendar','confirmacao','api',''];
  const path = to.split(/[?#]/, 1)[0];
  if (!reserved.includes(segment) && (path === '/' || path === '/agendar' || path.startsWith('/confirmacao/'))) {
    return '/' + segment + (path === '/' ? to.slice(1) : to);
  }
  return to;
}
export function Link({ to, ...rest }: LinkProps) {
  const pathname=useRouterState({select:s=>s.location.pathname});
  const { path, search, hash } = split(scopedPath(to,pathname));
  return <TLink to={path as never} search={search as never} hash={hash} {...rest} />;
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
    const { path, search, hash } = split(scopedPath(to,pathname));
    nav({ to: path as never, search: search as never, hash, replace: opts?.replace });
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
  const search = useSearch({ strict: false });
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      params.set(key, String(value));
    }
  }
  return [params];
}

export { Outlet };
