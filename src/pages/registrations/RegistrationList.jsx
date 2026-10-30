import { useListFilters } from '../../context/useListFilters.js';
import { externalRegistrationNumber } from "../../services/horseIdentifiers.js";
import { MSG, msg } from "../../messages/index.js";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus } from 'lucide-react';
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { listRegistrations } from "../../services/registrationService.js";
import { displayDate } from "../../services/displayDate.js";
import { REGISTRATION_STATUS, canEditRegistration, statusDisplay } from "../../constants/registration.js";
import RegistrationStatus from "../../components/registrations/RegistrationStatus.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import { DataTable, FilterChips, Pagination } from "../../components/ui/DataTable.jsx";
import { EmptyState, Skeleton } from "../../components/ui/States.jsx";
import { registrationTone } from "../../utils/statusTone.js";
import '../../style/lists.css';

/**
 * Bảng hồ sơ đăng ký của chủ ngựa: tên (mở hồ sơ), trạng thái, số giấy tờ, ngày tạo và thao tác được phép.
 * @param options0 { data }: trang dữ liệu từ GET /api/registrations.
 */
export function RegistrationListContent({ data }) {
    const open = item => `/registrations/${encodeURIComponent(item.id)}`;
    return <DataTable caption={msg(MSG.YEU_CAU_DANG_KY_NGUA)} rows={data.items}
        empty={<EmptyState title={msg(MSG.CHUA_CO_HO_SO_PHU_HOP_TAO_BAN_NHAP_DE_BAT_DAU)} action={<Link className="btn btn-primary" to="/registrations/new">{msg(MSG.DANG_KY_NGUA)}</Link>} />}
        columns={[
            { key: 'name', label: msg(MSG.TEN_NGUA), render: item => <Link className="hc-row-title" to={open(item)}><Avatar name={item.name || '?'} /><span><strong>{item.name || msg(MSG.BAN_NHAP_CHUA_CO_TEN)}</strong><small>{externalRegistrationNumber(item) || '—'}</small></span></Link> },
            { key: 'status', label: msg(MSG.TRANG_THAI), render: item => <RegistrationStatus status={item.status} /> },
            { key: 'code', label: msg(MSG.HORSE_EXTERNAL_CODE), render: item => externalRegistrationNumber(item) || '—' },
            { key: 'created', label: msg(MSG.NGAY_TAO), nowrap: true, render: item => displayDate(item.createdAt) },
            { key: 'open', label: <span className="visually-hidden">{msg(MSG.THAO_TAC)}</span>, align: 'end', render: item => <Link className="btn btn-outline-primary btn-sm" to={open(item)}>{canEditRegistration(item.status) ? msg(MSG.XEM_CHINH_SUA) : msg(MSG.VIEW)}</Link> },
        ]} />;
}

/**
 * Hồ sơ đăng ký ngựa của chủ ngựa (#13): lọc nhanh theo trạng thái, phân trang từ backend; bộ lọc giữ trên URL.
 */
export default function RegistrationList() {
    const [filter, setFilter] = useListFilters({ status: "", page: 1 });
    const load = useCallback(() => listRegistrations(filter), [filter]);
    const resource = useRegistrationResource(load, { realtime: true });
    const statuses = [{ value: '', label: msg(MSG.TAT_CA_TRANG_THAI) }, ...Object.values(REGISTRATION_STATUS).map(status => ({ value: status, label: statusDisplay(status).label, dot: registrationTone(status) }))];
    return <section className="list-page">
        <PageHeader title={msg(MSG.YEU_CAU_DANG_KY_NGUA)} description={msg(MSG.BAN_NHAP_CHU_SO_HUU)} actions={<Link className="btn btn-primary" to="/registrations/new"><Plus size={16} aria-hidden="true" />{msg(MSG.DANG_KY_NGUA)}</Link>} />
        <div className="hc-card is-flush list-card">
            <div className="list-filters"><FilterChips label={msg(MSG.TRANG_THAI)} options={statuses} value={filter.status} onChange={status => setFilter({ status, page: 1 })} /></div>
            {resource.loading && <div className="list-state"><Skeleton lines={3} /></div>}
            {resource.error && <div className="list-state"><RegistrationError error={resource.error} /><button type="button" className="btn btn-outline-primary" onClick={resource.reload}>{msg(MSG.THU_LAI)}</button></div>}
            {resource.data && <>
                <RegistrationListContent data={resource.data} />
                <Pagination page={resource.data.page} pageSize={resource.data.pageSize} total={resource.data.total} onChange={page => setFilter({ ...filter, page })} />
            </>}
        </div>
    </section>;
}
