import {useEffect,useId,useRef,useState} from 'react'
import Button from '../ui/Button'
import Field from '../ui/Field'
import ErrorState from '../common/ErrorState'
import EmptyState from '../common/EmptyState'
import {ShipmentLoading} from '../common/ShipmentComponents'
import {operationsError} from '../../utils/operations'
import {refreshOperations} from '../../hooks/useOperations'
export function Modal({title,onClose,children}) {
 const ref=useRef(null);const id=useId()
 const close=()=>{if(!ref.current?.querySelector('form[aria-busy="true"]'))onClose()}
 useEffect(()=>{const previous=document.activeElement;ref.current.showModal();const focusTarget=ref.current.querySelector('input:not([disabled]),select:not([disabled]),button:not([aria-label="Close dialog"]),h2');const frame=requestAnimationFrame(()=>focusTarget?.focus());return()=>{cancelAnimationFrame(frame);previous?.focus()}},[])
 return <dialog ref={ref} className="operations-dialog" aria-labelledby={id} onCancel={event=>{event.preventDefault();close()}}><header className="section-heading"><h2 id={id}>{title}</h2><Button variant="quiet" onClick={close} aria-label="Close dialog">Close</Button></header>{children}</dialog>
}
export function SelectField({label,options,error,...props}) {const id=useId();return <div className="field"><label htmlFor={id}>{label}</label><select id={id} aria-invalid={Boolean(error)} aria-describedby={error?id+'-help':undefined} {...props}>{options.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select>{error&&<p id={id+'-help'} className="field-error">{error}</p>}</div>}
export function ActionForm({submit,label='Save changes',children,onDone,canSubmit=true,refreshScopes}) {
 const [pending,setPending]=useState(false);const [error,setError]=useState('');const [fieldErrors,setFieldErrors]=useState({});const busy=useRef(false)
 const content=typeof children==='function'?children(fieldErrors):children
 return <form onSubmit={async event=>{event.preventDefault();if(busy.current)return;busy.current=true;setPending(true);setError('');setFieldErrors({});try{await submit();refreshOperations(refreshScopes);onDone?.()}catch(problem){const validation=problem.response?.data?.errorCode==='VALIDATION_ERROR'&&Array.isArray(problem.response.data.errors)?problem.response.data.errors.reduce((result,item)=>{if(item.field&&typeof item.message==='string')result[item.field]=item.message;return result},{}):{};setFieldErrors(validation);setError(operationsError(problem));}finally{busy.current=false;setPending(false)}}} aria-busy={pending}><fieldset className="auth-fields" disabled={pending}><legend className="sr-only">{label}</legend>{content}<Button type="submit" disabled={!canSubmit}>{pending?'Saving…':label}</Button></fieldset>{error&&<div className="auth-feedback" role="alert"><p>{error}</p>{Object.keys(fieldErrors).length>0&&<ul>{Object.values(fieldErrors).map((value,index)=><li key={index}>{value}</li>)}</ul>}</div>}</form>
}
export function ConfirmDialog({title,message,submit,onClose,refreshScopes}) {return <Modal title={title} onClose={onClose}><ActionForm submit={submit} label="Confirm" onDone={onClose} refreshScopes={refreshScopes}><p>{message}</p></ActionForm></Modal>}
export function EditForm({title,fields,initial,submit,onClose,note,refreshScopes}) {
 const [values,setValues]=useState(initial)
 return <Modal title={title} onClose={onClose}><ActionForm submit={()=>submit(values)} onDone={onClose} refreshScopes={refreshScopes}>{fieldErrors=><>{note&&<p className="role-note">{note}</p>}{fields.map(field=>field.options?<SelectField key={field.name} {...field} error={fieldErrors[field.name]} value={values[field.name]??''} onChange={event=>setValues({...values,[field.name]:event.target.value})}/>:<Field key={field.name} {...field} error={fieldErrors[field.name]} value={values[field.name]??''} onChange={event=>setValues({...values,[field.name]:event.target.value})}/>)}</>}</ActionForm></Modal>
}
export function DataTable({columns,rows,empty='No records yet'}) {return rows.length?<div className="operations-table" tabIndex={0} role="region" aria-label="Operational records"><table><thead><tr>{columns.map(([label])=><th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row._id}>{columns.map(([label,render])=><td key={label}>{render(row)}</td>)}</tr>)}</tbody></table></div>:<EmptyState title={empty} message="Records will appear here when available."/>}
export function LoadState({state,children}) {return state.loading?<ShipmentLoading/>:state.error?<ErrorState title="Could not load operations data" message={state.error} onRetry={state.refresh}/>:children}
export function OperationsHeader({title,state,children}) {return <header className="customer-header"><div><p className="eyebrow">OPERATIONS WORKSPACE</p><h1>{title}</h1></div><div className="customer-actions">{children}<Button variant="quiet" disabled={state.loading} onClick={state.refresh}>Refresh</Button></div></header>}
export function StatCard({label,value,supportingText}) {return <article className="stat-card"><span>{label}</span><strong>{value??'—'}</strong>{supportingText&&<small>{supportingText}</small>}</article>}
