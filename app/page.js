export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        background: "var(--bg)",
      }}
    >
      <img src="/logo.png" alt="Myracoustic" style={{ height: 60 }} />
      <p
        style={{
          fontFamily: "var(--font-mono), monospace",
          color: "var(--lime)",
          letterSpacing: "0.2em",
          fontSize: 13,
          textTransform: "uppercase",
        }}
      >
        Studio en cours de construction
      </p>
    </main>
  );
}
