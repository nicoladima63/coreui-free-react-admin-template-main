import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CModal,
  CModalHeader,
  CModalBody,
  CButton,
  CForm,
  CFormLabel,
  CFormInput,
  CAlert,
} from '@coreui/react';
import PCSelect from '../../components/PCSelect';

const ModalUser = ({ visible, onClose,onReload }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPc, setSelectedPc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSelect = (id) => {
    setSelectedPc(id); // Set the selected work ID
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setSelectedPc('');
    setSuccess(false);
    setError(null);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    axios
      .post('http://localhost:5000/api/users', {
        name,
        email,
        password,
        pc_id: selectedPc,
      })
      .then((response) => {
        console.log(response.data);
        onClose();
        onRefresh();
        resetForm();

      })
      .catch((error) => {
        console.error('Errore nella creazione dell\'utente:', error);
      });

  }



  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <h5>Nuovo utente</h5>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
        <CFormLabel>Nome</CFormLabel>
        <CFormInput
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ambrogietto"
          required
        />
        <CFormLabel>Email</CFormLabel>
        <CFormInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com"
          required
        />
        <CFormLabel>Password</CFormLabel>
        <CFormInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="kjadiube35EFG"
          required
        />
        <CFormLabel>Postazione</CFormLabel>
        <PCSelect onSelect={handleSelect} />
          <CButton type="submit">Salva</CButton>
        </CForm>


      </CModalBody>
    </CModal>
  )
}
export default ModalUser
