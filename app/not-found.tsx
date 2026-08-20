import Link from "next/link";

export default function NotFound() { return <main className="case-study"><p className="eyebrow">404</p><h1>Project not found.</h1><p>The requested project page is unavailable.</p><Link className="back-link" href="/">← All projects</Link></main>; }
