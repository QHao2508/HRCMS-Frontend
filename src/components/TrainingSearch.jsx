import {useState} from 'react';
import {MSG,msg} from '../messages/index.js';
export default function TrainingSearch({onSearch}) {
 const [value,setValue]=useState('');
 return <form className="filter-row" onSubmit={e=>{e.preventDefault();onSearch(value.trim());}}><div className="flex-grow-1"><label className="form-label" htmlFor="training-search">{msg(MSG.TRAINING_SEARCH)}</label><input id="training-search" className="form-control" value={value} maxLength={100} onChange={e=>setValue(e.target.value)}/></div><button className="btn btn-primary">{msg(MSG.SEARCH_ACTION)}</button><button type="button" className="btn btn-outline-secondary" onClick={()=>{setValue('');onSearch('');}}>{msg(MSG.SEARCH_CLEAR)}</button></form>;
}
