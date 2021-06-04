import Link from 'next/link';
import { useRouter } from 'next/router';
import { modules } from '../../modules';

export default function FilePage() {
  const router = useRouter();
  if (!router.query.file) {
    return null;
  }

  const id = router.query.file.join('/');

  if (!modules.has(id)) {
    return 'No file info available';
  }

  const mod = modules.get(id);

  return (
    <>
      <header>
        <Link href="/">Files</Link>
      </header>
      <h1>{id}</h1>
      <section>
        <header>
          <h2>Exports ({mod.exports.size})</h2>
        </header>
        <table>
          <thead>
            <tr>
              <th>Identifier</th>
              <th>Type</th>
              <th>From</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(mod.exports).map((info, i) => {
              return (
                <tr key={i}>
                  <td>{info.identifier}</td>
                  <td>{info.type}</td>
                  <td>{info.from}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <section>
        <header>
          <h2>Imports ({mod.imports.size})</h2>
        </header>
        {Array.from(mod.imports).map((id) => {
          return <article key={id}>{id}</article>;
        })}
      </section>
    </>
  );
}
