import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "noivos@exemplo.com";
  const password = process.env.ADMIN_PASSWORD ?? "troque-esta-senha";
  const name = process.env.ADMIN_NAME ?? "Maria Mercedez e Henrique";

  // Admin inicial
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash },
  });

  // Configurações (registro único)
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { setupCompleted: true },
    create: {
      id: "singleton",
      coupleNames: name,
      groomName: "Henrique",
      brideName: "Maria Mercedez",
      welcomeMsg:
        "Ficamos muito felizes em compartilhar este momento com você.",
      eventDate: new Date("2026-11-14T18:00:00-03:00"),
      eventTime: "18h00",
      venueName: "Espaço a definir",
      address: "Endereço a definir",
      mapsUrl: "https://maps.google.com",
      notifyEmail: process.env.NOTIFY_EMAIL ?? email,
      pixKey: "",
      pixKeyType: "email",
      pixCity: "BRASILIA",
      defaultAmount: 0,
      setupCompleted: true,
    },
  });

  // Categorias
  const categorias = [
    { name: "Cozinha", slug: "cozinha" },
    { name: "Eletrodomésticos", slug: "eletrodomesticos" },
    { name: "Quarto", slug: "quarto" },
    { name: "Sala", slug: "sala" },
    { name: "Lua de mel", slug: "lua-de-mel" },
  ];
  for (const c of categorias) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  const cozinha = await prisma.category.findUnique({
    where: { slug: "cozinha" },
  });
  const eletro = await prisma.category.findUnique({
    where: { slug: "eletrodomesticos" },
  });
  const lua = await prisma.category.findUnique({
    where: { slug: "lua-de-mel" },
  });

  // Presentes de exemplo
  const count = await prisma.gift.count();
  if (count === 0) {
    await prisma.gift.createMany({
      data: [
        {
          name: "Fogão 5 bocas",
          description: "Um fogão bonito para cozinharmos juntos.",
          imageUrl:
            "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
          price: "2500.00",
          desiredQty: 1,
          categoryId: eletro?.id,
        },
        {
          name: "Jogo de panelas",
          description: "Para os jantares da nova casa.",
          imageUrl:
            "https://images.unsplash.com/photo-1584990347449-a2d4c2c9a1c0?w=800",
          price: "600.00",
          desiredQty: 3,
          categoryId: cozinha?.id,
        },
        {
          name: "Diária de lua de mel",
          description: "Ajude a compor a nossa viagem dos sonhos.",
          imageUrl:
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
          price: "450.00",
          desiredQty: 7,
          categoryId: lua?.id,
        },
      ],
    });
  }

  console.log("Seed concluído. Admin:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
