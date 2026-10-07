import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { setImmediate } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import axios from "axios";

let server, service, api, store, Controls, Form, Profile;
const user = { id: "head-id", role: "HeadTrainer" };
const head = {
  id: "head-assignment",
  horseId: "horse-id",
  staffId: user.id,
  role: "HeadTrainer",
  active: true,
  startDate: "2025-01-01",
};
const trainer = {
  id: "previous-trainer",
  horseId: "horse-id",
  staffId: "old-trainer",
  role: "Trainer",
  active: true,
  startDate: "2025-02-01",
};
const data = {
  horse: { id: "horse-id", archived: false },
  assignments: [head, trainer],
  preferences: { preferredHeadTrainerId: "preferred-head" },
};
const values = {
  staffId: "new-trainer",
  role: "Trainer",
  startDate: "2025-03-01",
  notes: "  Keep notes unchanged  ",
};
const updated = {
  ...data,
  assignments: [
    head,
    { ...trainer, active: false, endDate: values.startDate },
    { ...values, id: "new-assignment", horseId: "horse-id", active: true },
  ],
};
const reply = (config, body) => ({
  config,
  data: body,
  status: 200,
  statusText: "",
  headers: {},
});
function reject(config, status) {
  throw new axios.AxiosError("Rejected", "ERR_BAD_RESPONSE", config, null, {
    ...reply(config, { detail: "Assignment could not be completed." }),
    status,
  });
}
before(async () => {
  server = await createServer({
    configFile: false,
    plugins: [
      {
        name: "trainer-form-handlers",
        enforce: "post",
        transform(code, id) {
          if (
            !id
              .replaceAll("\\", "/")
              .endsWith("/components/horses/AdministrativeAssignment.jsx")
          )
            return;
          return code
            .replaceAll('"react/jsx-dev-runtime"', '"virtual:trainer-jsx"')
            .replaceAll('"react"', '"virtual:trainer-react"');
        },
        resolveId(id) {
          if (id.startsWith("virtual:trainer-")) return `\0${id}`;
        },
        load(id) {
          if (id === "\0virtual:trainer-react")
            return `export * from 'react'; import {useState as original} from 'react';
                export function useState(initial) {const real = original(initial); return globalThis.__trainer.states.length ? [globalThis.__trainer.states.shift(), real[1]] : real;}`;
          if (id === "\0virtual:trainer-jsx")
            return `import {jsxDEV as original} from 'react/jsx-dev-runtime'; export {Fragment} from 'react/jsx-dev-runtime';
                export function jsxDEV(type,props,...rest) { if(type==='form') globalThis.__trainer.forms.push(props); return original(type,props,...rest); }`;
        },
      },
      react(),
    ],
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
    logLevel: "error",
  });
  service = await server.ssrLoadModule("/src/services/assignmentService.js");
  ({ default: api } = await server.ssrLoadModule("/src/services/api.js"));
  store = await server.ssrLoadModule("/src/services/sessionStore.js");
  ({ default: Controls } = await server.ssrLoadModule(
    "/src/components/horses/TrainerAssignment.jsx",
  ));
  ({ AssignmentForm: Form } = await server.ssrLoadModule(
    "/src/components/horses/AdministrativeAssignment.jsx",
  ));
  ({ HorseProfileResult: Profile } = await server.ssrLoadModule(
    "/src/pages/horses/HorseProfile.jsx",
  ));
});
beforeEach(() => {
  globalThis.__trainer = { forms: [], states: [] };
  store.clearSession();
  store.setTokens(
    {
      accessToken: "trainer-test-access",
      refreshToken: "trainer-test-refresh",
      expiresIn: 3600,
    },
    store.getSession().generation,
  );
  store.setCurrentUser(
    { ...user, active: true, emailVerified: true },
    store.getSession().generation,
  );
  api.defaults.adapter = async () => {
    throw new Error("Unexpected request; no live backend used");
  };
});
after(async () => {
  await server?.close();
  delete globalThis.__trainer;
});
const render = (element) => renderToStaticMarkup(element);
function form(overrides = {}, confirmed = false) {
  globalThis.__trainer.states = [{}, confirmed];
  return render(
    h(Form, {
      trainerOnly: true,
      values,
      setValues() {},
      candidates: { data: [{ id: values.staffId, role: "Trainer" }] },
      assignments: data.assignments,
      onSubmit() {},
      ...overrides,
    }),
  );
}
test("actively assigned HeadTrainer sees integrated Trainer controls and no administrative form", () => {
  const html = render(
    h(Profile, { user, actorRole: user.role, resource: { data } }),
  );
  assert.match(html, /aria-label="Trainer assignment"/);
  assert.match(html, /Assign Trainer/);
  assert.doesNotMatch(html, /Assign official administrative staff/);
});
for (const role of [
  "HorseOwner",
  "ClubManager",
  "Trainer",
  "Groom",
  "Veterinarian",
  "WorkRider",
  "unknown",
  undefined,
]) {
  test(`${role} cannot see Trainer assignment controls even with an assignment matching their id`, () => {
    assert.equal(render(h(Controls, { user: { ...user, role }, data })), "");
  });
}
test("HeadTrainer authority requires exact active role, user id and Horse id", () => {
  for (const assignment of [
    { ...head, active: false },
    { ...head, active: "true" },
    { ...head, staffId: "another-head" },
    { ...head, horseId: "another-horse" },
    { ...head, horseId: undefined },
    { ...head, role: "Trainer" },
    { ...head, role: "Head Trainer" },
  ]) {
    const wrong = { ...data, assignments: [assignment] };
    assert.equal(service.canAssignTrainer(user, wrong), false);
    assert.equal(render(h(Controls, { user, data: wrong })), "");
  }
});
test("missing data and Owner preference alone fail closed", () => {
  for (const incomplete of [
    null,
    {},
    { horse: data.horse },
    { ...data, assignments: [] },
    {
      ...data,
      assignments: {},
      preferences: { preferredHeadTrainerId: user.id },
    },
  ])
    assert.equal(service.canAssignTrainer(user, incomplete), false);
  assert.equal(service.canAssignTrainer({ role: "HeadTrainer" }, data), false);
  assert.equal(
    service.canAssignTrainer(user, {
      ...data,
      horse: { ...data.horse, archived: true },
    }),
    false,
  );
});
test("GUID casing does not change authority and removed HeadTrainer authority disappears on refreshed detail", () => {
  assert.equal(
    service.canAssignTrainer({ ...user, id: user.id.toUpperCase() }, data),
    true,
  );
  const refreshed = {
    ...updated,
    assignments: updated.assignments.filter(
      (item) => item.role !== "HeadTrainer",
    ),
  };
  assert.equal(render(h(Controls, { user, data: refreshed })), "");
});
test("Trainer directory requests exact role with pagination and removes wrong-role/inactive candidates", async () => {
  let page = 0;
  api.defaults.adapter = async (config) => {
    page++;
    assert.equal(config.url, "/api/staff/directory");
    assert.deepEqual(config.params, { role: "Trainer", page, pageSize: 20 });
    return reply(config, {
      page,
      pageSize: 20,
      total: 40,
      items: [
        { id: `trainer-${page}`, role: "Trainer" },
        ...[
          "HeadTrainer",
          "Groom",
          "Veterinarian",
          "WorkRider",
          "ClubManager",
          "HorseOwner",
        ].map((role) => ({ id: role, role })),
        { id: "inactive", role: "Trainer", active: false },
      ],
    });
  };
  assert.deepEqual(
    (await service.listTrainerCandidates()).map((item) => item.id),
    ["trainer-1", "trainer-2"],
  );
});
test("Trainer form has fixed role and excludes wrong-role choices", () => {
  const html = form({
    candidates: {
      data: [
        { id: "eligible", role: "Trainer" },
        { id: "wrong-head", role: "HeadTrainer" },
      ],
    },
  });
  assert.match(html, /Assignment role: Trainer/);
  assert.doesNotMatch(html, /id="assignment-role"|option value="wrong-head"/);
  assert.match(html, /option value="eligible"/);
});
for (const initial of [true, false]) {
  test(`${initial ? "initial" : "replacement"} Trainer assignment sends exact payload and refetches full authoritative history`, async () => {
    const calls = [];
    api.defaults.adapter = async (config) => {
      calls.push(config.method);
      assert.equal(
        config.url,
        config.method === "post"
          ? "/api/horses/horse-id/assignments"
          : "/api/horses/horse-id",
      );
      if (config.method === "post") {
        assert.deepEqual(JSON.parse(config.data), values);
        assert.equal(config.retryOnUnauthorized, false);
        return reply(config, { id: "new-assignment" });
      }
      return reply(
        config,
        initial
          ? {
              ...updated,
              assignments: updated.assignments.filter(
                (item) => item.id !== trainer.id,
              ),
            }
          : updated,
      );
    };
    const result = await service.assignTrainer("horse-id", {
      ...values,
      horseId: "excluded",
      headTrainerId: "excluded",
      ownerId: "excluded",
      preferredTrainerId: "excluded",
    });
    assert.deepEqual(calls, ["post", "get"]);
    assert.ok(
      result.assignments.some(
        (item) => item.active && item.staffId === "new-trainer",
      ),
    );
    if (!initial) {
      const html = render(
        h(Profile, { user, actorRole: user.role, resource: { data: result } }),
      );
      assert.match(html, /old-trainer/);
      assert.match(html, /Inactive/);
      assert.match(html, /new-trainer/);
    }
  });
}
test("Trainer service rejects administrative roles and Manager roles remain unchanged", async () => {
  assert.deepEqual(service.ADMIN_ASSIGNMENT_ROLES, [
    "HeadTrainer",
    "Groom",
    "Veterinarian",
  ]);
  for (const role of service.ADMIN_ASSIGNMENT_ROLES)
    await assert.rejects(
      service.assignTrainer("horse-id", { ...values, role }),
    );
  await assert.rejects(service.assignAdministrativeStaff("horse-id", values));
  await assert.rejects(service.listAssignmentCandidates("Trainer"));
});
test("Trainer dates preserve valid calendar dates and reject future/default/invalid dates", () => {
  for (const startDate of ["", "0001-01-01", "2025-02-30", "2025-03-02"])
    assert.ok(
      service.validateTrainerAssignment(
        { ...values, startDate },
        [],
        "2025-03-01",
      ).startDate,
    );
  assert.deepEqual(
    service.validateTrainerAssignment(values, [], "2025-03-01"),
    {},
  );
  assert.deepEqual(
    service.validateTrainerAssignment(
      { ...values, startDate: "1990-01-01" },
      [],
      "2025-03-01",
    ),
    {},
  );
});
test("Trainer replacement cannot predate current Trainer but does not use administrative start dates", () => {
  assert.ok(
    service.validateTrainerAssignment(
      { ...values, startDate: "2025-01-31" },
      data.assignments,
    ).startDate,
  );
  assert.deepEqual(
    service.validateTrainerAssignment(
      { ...values, startDate: trainer.startDate },
      data.assignments,
    ),
    {},
  );
  assert.deepEqual(
    service.validateTrainerAssignment(values, [
      { ...head, startDate: "2026-01-01" },
    ]),
    {},
  );
});
test("Trainer notes accept empty or 2000 characters and reject null/overlength", () => {
  for (const notes of ["", "n".repeat(2000)])
    assert.deepEqual(
      service.validateTrainerAssignment({ ...values, notes }),
      {},
    );
  for (const notes of [null, "n".repeat(2001)])
    assert.ok(service.validateTrainerAssignment({ ...values, notes }).notes);
});
test("replacement displays current Trainer, preserves history wording and requires confirmation", () => {
  let calls = 0;
  const html = form({
    onSubmit() {
      calls++;
    },
  });
  assert.match(html, /old-trainer/);
  assert.match(html, /Replace Trainer/);
  assert.match(html, /preserve its history/);
  assert.doesNotMatch(html, /delet/i);
  globalThis.__trainer.forms[0].onSubmit({ preventDefault() {} });
  assert.equal(calls, 0);
});
test("confirmed eligible Trainer submits while invalid candidates and role changes fail closed", () => {
  let calls = 0;
  form(
    {
      onSubmit() {
        calls++;
      },
    },
    true,
  );
  globalThis.__trainer.forms[0].onSubmit({ preventDefault() {} });
  assert.equal(calls, 1);
  for (const overrides of [
    { values: { ...values, role: "Groom" } },
    { candidates: { data: [{ id: values.staffId, role: "HeadTrainer" }] } },
    { candidates: { loading: true } },
    { busy: true },
  ]) {
    globalThis.__trainer.forms = [];
    form(
      {
        ...overrides,
        onSubmit() {
          calls++;
        },
      },
      true,
    );
    globalThis.__trainer.forms[0].onSubmit({ preventDefault() {} });
  }
  assert.equal(calls, 1);
});
test("Trainer submission lock prevents duplicate requests before render", async () => {
  let release,
    posts = 0;
  api.defaults.adapter = async (config) => {
    if (config.method === "post") {
      posts++;
      await new Promise((resolve) => {
        release = resolve;
      });
    }
    return reply(config, updated);
  };
  const submit = service.createTrainerSubmission();
  const first = submit("horse-id", values);
  assert.equal(await submit("horse-id", values), null);
  while (!release) await new Promise((resolve) => setImmediate(resolve));
  release();
  await first;
  assert.equal(posts, 1);
});
for (const status of [400, 403, 404, 409, 500]) {
  test(`Trainer ${status} handling preserves session and ${status === 400 ? "permits correction" : "requires authoritative reload"}`, async () => {
    let calls = 0;
    const session = store.getSession();
    api.defaults.adapter = async (config) => {
      calls++;
      reject(config, status);
    };
    const submit = service.createTrainerSubmission();
    await assert.rejects(
      submit("horse-id", values),
      (error) =>
        error.status === status && error.requiresReload === (status !== 400),
    );
    if (status !== 400) assert.equal(await submit("horse-id", values), null);
    assert.equal(calls, 1);
    assert.equal(store.getSession(), session);
  });
}
test("Trainer POST is not replayed after refresh", async () => {
  const urls = [];
  api.defaults.adapter = async (config) => {
    urls.push(config.url);
    if (config.url === "/api/auth/refresh")
      return reply(config, {
        accessToken: "renewed-test",
        refreshToken: "renewed-refresh-test",
        expiresIn: 3600,
      });
    reject(config, 401);
  };
  await assert.rejects(
    service.createTrainerSubmission()("horse-id", values),
    (error) => error.requiresReload,
  );
  assert.deepEqual(urls, [
    "/api/horses/horse-id/assignments",
    "/api/auth/refresh",
  ]);
});
test("ambiguous network/timeout responses never fabricate success or replay", async () => {
  for (const code of ["ERR_NETWORK", "ECONNABORTED"]) {
    let calls = 0;
    api.defaults.adapter = async (config) => {
      calls++;
      throw new axios.AxiosError("uncertain", code, config);
    };
    const submit = service.createTrainerSubmission();
    await assert.rejects(
      submit("horse-id", values),
      (error) => error.requiresReload,
    );
    assert.equal(await submit("horse-id", values), null);
    assert.equal(calls, 1);
  }
});
test("post-save detail failure requires reload before another Trainer submission", async () => {
  const calls = [];
  api.defaults.adapter = async (config) => {
    calls.push(config.method);
    if (config.method === "get") reject(config, 403);
    return reply(config, {});
  };
  const submit = service.createTrainerSubmission();
  await assert.rejects(
    submit("horse-id", values),
    (error) => error.requiresReload,
  );
  assert.equal(await submit("horse-id", values), null);
  assert.deepEqual(calls, ["post", "get"]);
});
