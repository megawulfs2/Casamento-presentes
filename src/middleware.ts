export { default } from "next-auth/middleware";

// Protege o painel, exceto a própria tela de login (evita loop de redirect).
// A camada extra de segurança está em src/app/admin/layout.tsx (getServerSession).
export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
