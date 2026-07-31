import { execFile } from 'node:child_process';
import { resolve4 } from 'node:dns/promises';
import { connect } from 'node:net';

const PING_TIMEOUT_MS = 2_000;
const DNS_TIMEOUT_MS = 2_000;
const TCP_TIMEOUT_MS = 2_000;

/**
 * Pings a host via the OS ping binary. Resolves `false` (never throws) on any
 * failure: non-zero exit, the ping binary being missing/unspawnable, or the
 * process not exiting within the backstop timeout.
 */
function pingHost(host: string, timeoutMs: number): Promise<boolean> {
  const isWindows = process.platform === 'win32';
  const args = isWindows
    ? ['-n', '1', '-w', String(timeoutMs), host]
    : ['-c', '1', '-W', String(Math.ceil(timeoutMs / 1000)), host];

  return new Promise((resolvePromise) => {
    execFile('ping', args, { timeout: timeoutMs + 500, killSignal: 'SIGKILL' }, (error) => {
      resolvePromise(!error);
    });
  });
}

/**
 * Races a promise against a timer. Node's `dns.resolve4` has no built-in
 * cancellation, so a hung DNS query is simply abandoned (safe, no leaked
 * handles) rather than left to block the caller indefinitely.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolvePromise) => {
    const timer = setTimeout(() => resolvePromise(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolvePromise(value);
      },
      () => {
        clearTimeout(timer);
        resolvePromise(fallback);
      },
    );
  });
}

/** Resolves `true` if a TCP connection to host:port succeeds within timeoutMs. */
function probeTcp(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const socket = connect({ host, port });
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolvePromise(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

/** General internet reachability check — Cloudflare's 1.1.1.1 reliably answers ICMP. */
export async function checkInternetConnectivity(): Promise<boolean> {
  return pingHost('1.1.1.1', PING_TIMEOUT_MS);
}

/**
 * Checks that the update binary store (GitHub) is reachable. Uses a DNS
 * resolve + TCP connect (not ICMP): GitHub sits behind Fastly, which commonly
 * drops ICMP echo even when the site is fully reachable over HTTPS, so a
 * ping-based check would false-negative. TCP-connecting to the resolved IP on
 * port 443 exercises the same protocol path the real update download uses.
 */
export async function checkGithubStoreReachable(): Promise<boolean> {
  const ips = await withTimeout(resolve4('github.com'), DNS_TIMEOUT_MS, [] as string[]);
  if (ips.length === 0) return false;
  return probeTcp(ips[0], 443, TCP_TIMEOUT_MS);
}
