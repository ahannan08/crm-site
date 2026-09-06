import { NextRequest, NextResponse } from "next/server";
import { createRegistrationRequest } from "@/lib/registration";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, company_name, phone } = body;

  if (!name?.trim() || !email?.trim() || !company_name?.trim()) {
    return NextResponse.json(
      { error: "Name, email, and company name are required." },
      { status: 400 }
    );
  }

  const result = await createRegistrationRequest({
    name,
    email,
    company_name,
    phone,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    message: "Registration submitted. You will receive an email once approved.",
  });
}
