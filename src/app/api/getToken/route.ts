import { NextRequest, NextResponse } from "next/server";

let recaptchaToken = "";
let isNew = false;
let siteKey = "";

export async function PUT() {
  try {
    return NextResponse.json(
      { isNew, message: "There is a new request.", siteKey },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving token:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    isNew = false;
    siteKey = "";
  }
}

export async function POST(req: NextRequest) {
  const { isToken } = await req.json();
  const token = req.headers.get("Token");
  console.log(token, "frontend token");
  if (!isToken || !token) {
    return NextResponse.json(
      { success: false, message: "Missing token or flag" },
      { status: 400 }
    );
  }
  try {
    recaptchaToken = token;
    return NextResponse.json({ success: true, message: "Token saved" });
  } catch (error) {
    console.error("Error saving token:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    isNew = false;
    siteKey = "";
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const site_Key = searchParams.get("siteKey");
  if (!site_Key) {
    NextResponse.json({ message: "You missed Site Key." }, { status: 400 });
    return;
  }
  siteKey = site_Key;
  try {
    // Wait for up to 15 seconds for the token to be set
    isNew = true;
    const timeoutMs = 15000;
    const intervalMs = 200;
    let waited = 0;

    while (!recaptchaToken && waited < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      waited += intervalMs;
    }

    if (!recaptchaToken) {
      return NextResponse.json(
        { success: false, message: "Timeout: Token not available yet." },
        { status: 408 }
      );
    }
    return NextResponse.json(
      { success: true, recaptchaToken },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving token:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    recaptchaToken = "";
  }
}
