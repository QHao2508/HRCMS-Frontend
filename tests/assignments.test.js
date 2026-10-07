import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import axios from "axios";
import { setImmediate } from "node:timers";

let server, service, api, store, Controls, Form, Assignments, Profile;
const values = {
  staffId: "staff-id",
  role: "HeadTrainer",
  startDate: "2025-02-03",
  notes: "",
};
const old = {
  id: "previous",
  staffId: "old-staff",
  role: "HeadTrainer",
  startDate: "2025-01-01",
  active: true,
};
const detail = {
  horse: { id: "horse-id" },
  assignments: [
    { ...old, active: false, endDate: values.startDate },
    { ...values, id: "new", active: true },
  ],
};
const reply = (config, data) => ({
  config,
  data,
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
        name: "assignment-handlers",
        enforce: "post",
        transform(code, id) {
          if (
            !id
              .replaceAll("\\", "/")
              .endsWith("/components/horses/AdministrativeAssignment.jsx")
          )
            return;
          return code
            .replaceAll('"react/jsx-dev-runtime"', '"virtual:assignment-jsx"')
            .replaceAll('"react"', '"virtual:assignment-react"');
        },
        resolveId(id) {
          if (id.startsWith("virtual:assignment-")) return `\0${id}`;
        },
        load(id) {
          if (id === "\0virtual:assignment-react")
            return `export * from 'react'; import {useState as original} from 'react';
                export function useState(initial) { const real = original(initial); return globalThis.__assign.states.length ? [globalThis.__assign.states.shift(), real[1]] : real; }`;
          if (id === "\0virtual:assignment-jsx")
            return `import {jsxDEV as original} from 'react/jsx-dev-runtime'; export {Fragment} from 'react/jsx-dev-runtime';
                export function jsxDEV(type, props, ...rest) { if(type === 'form') globalThis.__assign.forms.push(props); if(type === 'select') globalThis.__assign.selects.push(props); return original(type,props,...rest); }`;
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
  ({ default: Controls, AssignmentForm: Form } = await server.ssrLoadModule(
    "/src/components/horses/AdministrativeAssignment.jsx",
  ));
  ({ default: Assignments } = await server.ssrLoadModule(
    "/src/components/horses/HorseAssignments.jsx",
  ));
  ({ HorseProfileResult: Profile } = await server.ssrLoadModule(
    "/src/pages/horses/HorseProfile.jsx",
  ));
});
beforeEach(() => {
  globalThis.__assign = { forms: [], selects: [], states: [] };
  store.clearSession();
  store.setTokens(
    {
      accessToken: "test-access",
      refreshToken: "test-refresh",
      expiresIn: 3600,
    },
    store.getSession().generation,
  );
  store.setCurrentUser(
    { id: "manager", role: "ClubManager", active: true, emailVerified: true },
    store.getSession().generation,
  );
  api.defaults.adapter = async () => {
    throw new Error("Unexpected request");
  };
});
after(async () => {
  await server?.close();
  delete globalThis.__assign;
});
const render = (component) => renderToStaticMarkup(component);
function form(overrides = {}, confirmed = false) {
  globalThis.__assign.states = [{}, confirmed];
  return render(
    h(Form, {
      values,
      setValues() {},
      candidates: { data: [{ id: values.staffId, role: values.role }] },
      assignments: [old],
      onSubmit() {},
      ...overrides,
    }),
  );
}
for (const role of [
  "HorseOwner",
  "HeadTrainer",
  "Trainer",
  "Groom",
  "Veterinarian",
  "WorkRider",
  "Unknown",
  undefined,
]) {
  test(`${role} cannot access administrative assignment controls`, () => {
    assert.equal(render(h(Controls, { actorRole: role, data: detail })), "");
  });
}
test("Manager sees controls but archived Horses do not permit assignments", () => {
  assert.match(
    render(h(Controls, { actorRole: "ClubManager", data: detail })),
    /Assign official administrative staff/,
  );
  assert.equal(
    render(
      h(Controls, {
        actorRole: "ClubManager",
        data: { ...detail, horse: { ...detail.horse, archived: true } },
      }),
    ),
    "",
  );
});
test("loaded Horse profile integrates Manager controls while every other role remains read-only", () => {
  for (const actorRole of [
    "ClubManager",
    "HorseOwner",
    "HeadTrainer",
    "Trainer",
    "Groom",
    "Veterinarian",
    "WorkRider",
    "unknown",
  ]) {
    const html = render(
      h(Profile, { actorRole, resource: { data: detail, reload() {} } }),
    );
    assert.equal(
      html.includes("Assign official administrative staff"),
      actorRole === "ClubManager",
    );
    assert.match(html, /Owner staff preferences/);
    assert.match(html, /Assignment history/);
  }
});
test("exact administrative roles exclude Trainer and WorkRider", () => {
  assert.deepEqual(service.ADMIN_ASSIGNMENT_ROLES, [
    "HeadTrainer",
    "Groom",
    "Veterinarian",
  ]);
  const html = form();
  assert.doesNotMatch(
    html,
    /value="(?:Trainer|WorkRider|HorseOwner|ClubManager)"/,
  );
});
for (const role of ["HeadTrainer", "Groom", "Veterinarian"]) {
  test(`${role} directory uses exact role, follows pages and excludes unexpected candidates`, async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => {
      calls++;
      assert.equal(config.url, "/api/staff/directory");
      assert.deepEqual(config.params, { role, page: calls, pageSize: 20 });
      return reply(config, {
        items: [
          { id: `eligible-${calls}`, role },
          { id: "wrong", role: "Trainer" },
          { id: "inactive", role, active: false },
        ],
        page: calls,
        pageSize: 20,
        total: 40,
      });
    };
    assert.deepEqual(
      (await service.listAssignmentCandidates(role)).map((item) => item.id),
      ["eligible-1", "eligible-2"],
    );
  });
  test(`${role} assignment sends exact payload, disables replay and refetches authoritative history`, async () => {
    const calls = [];
    api.defaults.adapter = async (config) => {
      calls.push(config.method);
      if (config.method === "post") {
        assert.equal(config.url, "/api/horses/horse-id/assignments");
        assert.equal(config.retryOnUnauthorized, false);
        assert.deepEqual(JSON.parse(config.data), { ...values, role });
        return reply(config, {});
      }
      assert.equal(config.url, "/api/horses/horse-id");
      return reply(config, detail);
    };
    const result = await service.assignAdministrativeStaff("horse-id", {
      ...values,
      role,
      ownerId: "excluded",
      preferredHeadTrainerId: "excluded",
    });
    assert.deepEqual(result, detail);
    assert.deepEqual(calls, ["post", "get"]);
    const html = render(h(Assignments, { assignments: result.assignments }));
    assert.match(html, /old-staff/);
    assert.match(html, /staff-id/);
    assert.match(html, /Inactive/);
  });
}
test("unsupported administrative roles cannot call directory or mutation", async () => {
  for (const role of [
    "Trainer",
    "WorkRider",
    "ClubManager",
    "HorseOwner",
    "unknown",
  ]) {
    await assert.rejects(service.listAssignmentCandidates(role));
    await assert.rejects(
      service.assignAdministrativeStaff("horse-id", { ...values, role }),
    );
  }
});
test("dates reject future, missing, invalid and default dates without shifting valid calendar values", () => {
  for (const startDate of [
    "",
    "2025-02-30",
    "0001-01-01",
    "2026-02-04",
    "02/03/2025",
  ])
    assert.ok(
      service.validateAssignment({ ...values, startDate }, [], "2026-02-03")
        .startDate,
    );
  for (const startDate of ["2026-02-03", "2025-02-03"])
    assert.deepEqual(
      service.validateAssignment({ ...values, startDate }, [], "2026-02-03"),
      {},
    );
  assert.equal(values.startDate, "2025-02-03");
});
test("replacement rejects dates before current start but not arbitrary backdating", () => {
  assert.ok(
    service.validateAssignment({ ...values, startDate: "2024-12-31" }, [old])
      .startDate,
  );
  assert.deepEqual(
    service.validateAssignment({ ...values, startDate: old.startDate }, [old]),
    {},
  );
  assert.deepEqual(
    service.validateAssignment({ ...values, startDate: "1990-01-01" }, []),
    {},
  );
});
test("notes permit empty strings, preserve content and enforce 2000 characters", () => {
  for (const notes of ["", "  keep spacing  ", "n".repeat(2000)])
    assert.deepEqual(service.validateAssignment({ ...values, notes }), {});
  for (const notes of [null, "n".repeat(2001)])
    assert.ok(service.validateAssignment({ ...values, notes }).notes);
});
test("replacement shows current assignee and requires explicit confirmation", () => {
  let calls = 0;
  const html = form({
    onSubmit() {
      calls++;
    },
  });
  assert.match(html, /old-staff/);
  assert.match(html, /replace the current active assignment/);
  assert.match(html, /preserve its history/);
  globalThis.__assign.forms[0].onSubmit({ preventDefault() {} });
  assert.equal(calls, 0);
});
test("confirmed eligible assignment invokes submit; changing role clears selection", () => {
  let submitted, changed;
  form(
    {
      onSubmit(value) {
        submitted = value;
      },
      setValues(value) {
        changed = value;
      },
    },
    true,
  );
  globalThis.__assign.forms[0].onSubmit({ preventDefault() {} });
  assert.deepEqual(submitted, values);
  globalThis.__assign.selects[0].onChange({ target: { value: "Groom" } });
  assert.equal(changed.staffId, "");
  assert.equal(changed.role, "Groom");
});
test("wrong-role candidates cannot appear or submit even with confirmation", () => {
  let calls = 0;
  const html = form(
    {
      candidates: { data: [{ id: values.staffId, role: "Trainer" }] },
      onSubmit() {
        calls++;
      },
    },
    true,
  );
  assert.doesNotMatch(html, /option value="staff-id"/);
  globalThis.__assign.forms[0].onSubmit({ preventDefault() {} });
  assert.equal(calls, 0);
});
test("loading, failed, empty or inactive candidates cannot submit", () => {
  for (const candidates of [
    { loading: true },
    { error: { status: 403 } },
    { data: [] },
    { data: [{ id: values.staffId, role: values.role, active: false }] },
  ]) {
    globalThis.__assign.forms = [];
    let calls = 0;
    form(
      {
        candidates,
        onSubmit() {
          calls++;
        },
      },
      true,
    );
    globalThis.__assign.forms[0].onSubmit({ preventDefault() {} });
    assert.equal(calls, 0);
  }
});
test("preferences cannot become active assignments and Trainer stays read-only", () => {
  assert.deepEqual(
    service.activeForRole(
      [
        { ...old, active: false },
        { ...old, role: "Trainer" },
      ],
      "HeadTrainer",
    ),
    [],
  );
  const html = render(
    h(Assignments, { assignments: [{ ...old, role: "Trainer" }] }),
  );
  assert.match(html, /Trainer/);
  assert.doesNotMatch(html, /<button|<form|<select/);
  assert.match(form({ assignments: [] }), /No current active HeadTrainer/);
});
test("pending form cannot submit", () => {
  let calls = 0;
  form(
    {
      busy: true,
      onSubmit() {
        calls++;
      },
    },
    true,
  );
  globalThis.__assign.forms[0].onSubmit({ preventDefault() {} });
  assert.equal(calls, 0);
});
test("synchronous submission lock prevents two POSTs before render", async () => {
  let release,
    calls = 0;
  api.defaults.adapter = async (config) => {
    if (config.method === "post") {
      calls++;
      await new Promise((resolve) => {
        release = resolve;
      });
    }
    return reply(config, detail);
  };
  const submit = service.createAssignmentSubmission();
  const first = submit("horse-id", values);
  assert.equal(await submit("horse-id", values), null);
  while (!release) await new Promise((resolve) => setImmediate(resolve));
  release();
  await first;
  assert.equal(calls, 1);
});
for (const status of [400, 403, 404, 409, 500]) {
  test(`${status} error preserves session, never retries and ${status === 400 ? "permits correction" : "requires reload"}`, async () => {
    let calls = 0;
    const session = store.getSession();
    api.defaults.adapter = async (config) => {
      calls++;
      reject(config, status);
    };
    const submit = service.createAssignmentSubmission();
    await assert.rejects(
      submit("horse-id", values),
      (error) =>
        error.status === status && error.requiresReload === (status !== 400),
    );
    if (status === 400) await assert.rejects(submit("horse-id", values));
    else assert.equal(await submit("horse-id", values), null);
    assert.equal(calls, status === 400 ? 2 : 1);
    assert.equal(store.getSession(), session);
  });
}
test("ambiguous network failure blocks another submission without inventing success", async () => {
  let calls = 0;
  api.defaults.adapter = async (config) => {
    calls++;
    throw new axios.AxiosError("offline", "ERR_NETWORK", config);
  };
  const submit = service.createAssignmentSubmission();
  await assert.rejects(
    submit("horse-id", values),
    (error) => error.requiresReload,
  );
  assert.equal(await submit("horse-id", values), null);
  assert.equal(calls, 1);
});
test("401 refreshes without replaying assignment POST", async () => {
  const calls = [];
  api.defaults.adapter = async (config) => {
    calls.push(config.url);
    if (config.url === "/api/auth/refresh")
      return reply(config, {
        accessToken: "refreshed-test",
        refreshToken: "refreshed-test-token",
        expiresIn: 3600,
      });
    reject(config, 401);
  };
  await assert.rejects(
    service.createAssignmentSubmission()("horse-id", values),
    (error) => error.requiresReload,
  );
  assert.deepEqual(calls, [
    "/api/horses/horse-id/assignments",
    "/api/auth/refresh",
  ]);
});
test("post-success refetch failure or malformed detail requires reload, never another POST", async () => {
  for (const failure of [true, false]) {
    const calls = [];
    api.defaults.adapter = async (config) => {
      calls.push(config.method);
      if (config.method === "post") return reply(config, {});
      if (failure) reject(config, 400);
      return reply(config, {});
    };
    const submit = service.createAssignmentSubmission();
    await assert.rejects(
      submit("horse-id", values),
      (error) => error.requiresReload,
    );
    assert.equal(await submit("horse-id", values), null);
    assert.deepEqual(calls, ["post", "get"]);
  }
});
