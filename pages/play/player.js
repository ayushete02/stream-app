import React from "react";
import axios from 'axios';
import { ethers } from "ethers";
import { LoadingOutlined } from '@ant-design/icons';
import { Chat } from "@pushprotocol/uiweb";
import { Framework } from "@superfluid-finance/sdk-core";

import { Layout,Spin, Row, Col, Card, Meta, Skeleton, Image, Button, Input, Popover, Typography, Space } from 'antd';

import Navbar from '../../components/navbar'

const { Header, Footer, Sider, Content } = Layout;
const { Title, Text, Link } = Typography;
import VideoJS from '../../components/VideoJS';


class Player extends React.Component {
  constructor(props) {
    super(props);
    console.log("pid-play", this.props.pid)
    this.playerRef = React.createRef();
    this.state = {
      ingest_url: null,
      nft_description: null,
      nft_image: null,
      nft_name: null,
      nft_symbol: null,
      stream_name: null,
      playback_url: null,
      stream_key: null,
      isLoading: true,
      address: null,
      support_Address: null,
      inputAddress: null,
      NFTMintingAddress: null,
      streamer_address: null,
      minter_avatar_url: null,
      generated_nft_url: null,
    }
  }

  async componentDidMount() {
    console.log("componentDidMount")
    this.getStreamData()
    await this.setAddress();
  }

  setDataFromIpfs = (ipfsResponse) => {
    console.log("setDataFromIpfs", ipfsResponse)
    this.setState({
      ingest_url: ipfsResponse.ingest_url,
      nft_description: ipfsResponse.nft_description,
      nft_image: ipfsResponse.nft_image,
      nft_name: ipfsResponse.nft_name,
      nft_symbol: ipfsResponse.nft_symbol,
      playback_url: ipfsResponse.playback_url,
      stream_key: ipfsResponse.stream_key,
      stream_name: ipfsResponse.stream_name,
      streamer_address: ipfsResponse.streamer_address,
      isLoading: false
    })
  }

  getStreamData = async () => {
    const { pid } = this.props;
    console.log("get stream data", pid)

    const response = await axios
      .get(`https://ipfs.io/ipfs/${pid}`)
      .then(res => {
        console.log("got stream data yay", res.data)
        return res.data

      })

    this.setDataFromIpfs(response);
  }

  handlePlayerReady = (player) => {

    this.playerRef.current = player;

    // you can handle player events here
    player.on('waiting', () => {
      console.log('player is waiting');
    });

    player.on('dispose', () => {
      console.log('player will dispose');
    });
  };


  setAddress = async () => {
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    this.setState({
      address: accounts[0],
      support_Address: accounts[0]
    })
  }

  connectWallet = async () => {
    console.log("connectWallet")
    if (this.state.address) return null
    const { ethereum } = window;
    await ethereum.request({ method: 'eth_requestAccounts' });
    await this.setAddress();
  }

  setConnectedWalletAddressAsMintAddress = () => {
    const { address } = this.state;
    this.setState({
      NFTMintingAddress: address
    })
  }

  getGeneratedNFTImage = async () => {
    const { NFTMintingAddress, nft_image, stream_name, streamer_address, minter_avatar_url } = this.state;
    console.log(NFTMintingAddress, nft_image, stream_name, streamer_address, minter_avatar_url)

    const minterUrl = minter_avatar_url ? minter_avatar_url : "https://hack.ethglobal.com/static/nologo.png";


    const url = `https://api.dynapictures.com/links/23b04aa2cd.png?params=image7---imageUrl___${nft_image}%3C%3Etext9---text___${encodeURIComponent(stream_name)}%3C%3Eimage10---imageUrl__https://hack.ethglobal.com/static/nologo.png%3C%3Eimage11---imageUrl__${minterUrl}%3C%3Etext14---text___${streamer_address}%3C%3Etext15---text___${NFTMintingAddress}&metadata=black`

    console.log("NFT image created at ", url)
    this.setState({
      generated_nft_url: url
    })
  }

  mintNFTPort = async () => {
    const {
      isLoading,
      ingest_url,
      nft_description,
      nft_image,
      nft_name,
      nft_symbol,
      playback_url,
      stream_key,
      address,
      streamer_address,
      stream_name
    } = this.state;

    const options = {
      method: 'POST',
      url: 'https://api.nftport.xyz/v0/mints/easy/urls',
      headers: { 'Content-Type': 'application/json', Authorization: 'bfb1eeca-e144-4c3b-82ab-13d5bef82804' },
      // headers: { 'Content-Type': 'application/json', Authorization: process.env.NEXT_PUBLIC_NFT_PORT_API_KEY },
      data: {
        chain: 'polygon',
        name: nft_name,
        description: nft_description,
        file_url: nft_image,
        mint_to_address: address
      }
    };

    axios.request(options).then(function (response) {
      console.log(response.data);
    }).catch(function (error) {
      console.error(error);
    });
  }

  setMintAddress = (address) => {
    this.setState({
      NFTMintingAddress: address
    })
  }

  onAddingAddress = async () => {
    const { inputAddress } = this.state;
    console.log(inputAddress, "inputAddress")
    var minter_avatar_url = null;
    if (ethers.utils.isAddress(inputAddress)) {
      this.setMintAddress(inputAddress);
    } else {
      const provider = new ethers.providers.AlchemyProvider(null, 'Mi8Rd86q2Z3ngHOnGLe0yaYjIhrjIIOR');
      // const provider = new ethers.providers.AlchemyProvider(null, process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);
      const address = await provider.resolveName(inputAddress)

      try {
        const resolver = await provider.getResolver(inputAddress);
        const avatar = await resolver.getText("avatar")
        const avatar_opensea = "https://api.opensea.io/api/v1/asset/" + avatar.split(":")[2]

        const options = {
          method: 'GET',
          url: avatar_opensea,
          params: { format: 'json' }
        };

        await axios.request(options).then(function (response) {
          console.log(response.data.image_url, "is the avatar response from opensea api");
          minter_avatar_url = response.data.image_url

        }).catch(function (error) {
          console.error(error);
        });
      } catch (e) {
        console.log("err getting avatar")
      }
      this.setState({ minter_avatar_url: minter_avatar_url })

      this.setMintAddress(address);


    }
    await this.getGeneratedNFTImage()
  }


  handleInputChange = (e) => {
    this.setState({
      inputAddress: e.target.value
    })
  }


  createFlow = async () => {
    const recipient = this.state.streamer_address;
    const flowRate = "2000000000000"
    const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
    const { address } = this.state;


    const sf = await Framework.create({
      networkName: "kovan",
      provider: metamaskProvider
    });

    const signer = sf.createSigner({
      web3Provider: metamaskProvider
    });

    const DAIx = "0xe3cb950cb164a31c66e32c320a800d477019dcff";

    try {
      const createFlowOperation = sf.cfaV1.createFlow({
        sender: address,
        receiver: recipient,
        flowRate: flowRate,
        superToken: DAIx
        // userData?: string
      });

      console.log("Creating your stream...");

      const result = await createFlowOperation.exec(signer);
      console.log(result);

      console.log(
        `Congrats - you've just created a money stream!
      View Your Stream At: https://app.superfluid.finance/dashboard/${recipient}
      Network: Kovan
      Super Token: DAIx
      Sender: ${address},
      Receiver: ${recipient},
      FlowRate: ${flowRate}
      `
      );
    } catch (error) {
      console.log(
        "Hmmm, your transaction threw an error. Make sure that this stream does not already exist, and that you've entered a valid Ethereum address!"
      );
      console.error(error);
    }
  }


  render() {
    const { pid } = this.props;
    const {
      isLoading,
      ingest_url,
      nft_description,
      nft_image,
      nft_name,
      nft_symbol,
      playback_url,
      stream_key,
      address,
      support_Address,
      NFTMintingAddress,
      stream_name,
      streamer_address,
      minter_avatar_url
    } = this.state;


    console.log("streamData", ingest_url,
      nft_description,
      nft_image,
      nft_name,
      nft_symbol,
      playback_url,
      stream_key)


    const videoJsOptions = { // lookup the options in the docs for more options
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      sources: [{
        src: playback_url
      }]
    }

    return (
      <>
      <Navbar/>
        <Layout>
         
          <Content style={{ padding: "40px" }}>
            <Row>
              <Col span={16}>
                <div className=" relative bg-black h-56 lg:h-1/2 border-8 border-solid rounded-t-lg  border-white m-auto w-full xl:w-10/12  overflow-hidden">
                  <div data-vjs-player className=" px-200">
                    {playback_url ? (
                      <>
                        <VideoJS options={videoJsOptions} onReady={this.handlePlayerReady} />
                        <br />
                        <Title level={1}>{stream_name}</Title>
                        <Title level={5}>By: {streamer_address}</Title>

                      </>
                    ) : <div><LoadingOutlined
                    style={{
                      fontSize: 24,
                    }}
                    spin
                  /></div>}
                  </div>
                </div>
                <div className="relative h-56  m-auto w-full xl:w-10/12 overflow-hidden">
                <Card title={nft_name} bordered={false} style={{ width: '100%' }}>
                  Desc : {nft_description}<br />
                  Symbol : {nft_symbol}<br />
    </Card>

                </div>
              </Col>
              {/* {ipfsResponse} */}

              {!isLoading ? (
                <>
                <Col span={6} offset={1}>
                  <div className='mr-10 w-full border-8 border-solid rounded-lg  border-white bg-white'>

                  <Image
                    width={'100%'}
                    src={nft_image}
                  />

                  <div>

                    <Text strong>{nft_name}  </Text> <Text mark>{nft_symbol}</Text>
                    <br />
                    <Text type="secondary">{nft_description}</Text>
                    <br />
                  </div>
                  <br />
                  {address ?
                    <Button onClick={this.setConnectedWalletAddressAsMintAddress} type="button"
                    class="w-full items-center justify-center px-4 py-2 text-base font-medium leading-6 text-white whitespace-no-wrap bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600" size="large" block >Select {address.substring(0, 7)} </Button> :
                    <div>
                      <Button onClick={this.connectWallet} type="button"
                    class="w-full items-center justify-center px-4 py-2 text-base font-medium leading-6 text-white whitespace-no-wrap bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600" size="large" block>Connect Wallet</Button>

                    </div>

}

                  <br />
                  <Space direction="horizontal" style={{ width: '100%', justifyContent: 'center' }}>

                    or
                  </Space>
                  <br />

                  <Input.Group compact>
                    <Input style={{ width: 'calc(100% - 80px)' }} placeholder="Enter address or ens" name="address" onChange={this.handleInputChange} />
                    <Button type="button"
                    class="w-full items-center justify-center px-4 py-2 text-base font-medium leading-6 text-white whitespace-no-wrap bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600" onClick={this.onAddingAddress}>Submit</Button>
                  </Input.Group>
                  <br />
                  <br />
                  <div>
                    <Space direction="horizontal" style={{ width: '100%', justifyContent: 'center', padding: "5px" }}>
                      <Text strong>
                        <Image
                          src={minter_avatar_url}
                        />

                        {NFTMintingAddress ? `Mint NFT at  ${NFTMintingAddress.substring(0, 7)}` : "Select address to mint NFT"}
                      </Text>

                    </Space>
                  </div>
                  <Popover content="Minting without gas in Polygon Network using NFTPort." title="Gasless NFT Minting">
                    <Button
                      
                      size="large"
                      block
                      type="button"
                    class="w-full items-center justify-center px-4 py-2 text-base font-medium leading-6 text-white whitespace-no-wrap bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
                      onClick={this.mintNFTPort}
                    >Mint NFT without Gas</Button>
                  </Popover>
                  <br />
                  <br />
                  <Popover content="Subscribe via Superfluid" title="Subscribe">
                    <Button
                      type="button"
                      class="w-full items-center justify-center px-4 py-2 text-base font-medium leading-6 text-white whitespace-no-wrap bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
                      size="large"
                      block
                      onClick={this.createFlow}
                    >Subscribe 5 DAI / Month</Button>
                  </Popover>
              </div>
                </Col>
                </>
              ) : <div><LoadingOutlined
              style={{
                fontSize: 24,
              }}
              spin
            /></div>}
            </Row>
          </Content>
          <Chat
            account={address} //user address
            // We cant send message to send address so we Hardcode other address
            // supportAddress={support_Address} //support address
            supportAddress="0xC76139fcB9e4952CE9Fb3183C6c3af69534233FE" //support address
            // const key = process.env.apiKey;
            apiKey="jVPMCRom1B.iDRMswdehJG7NpHDiECIHwYMMv6k2KzkPJscFIDyW8TtSnk4blYnGa8DIkfuacU0"
            env="staging"
            modalTitle="Help Desk"
          />
        </Layout>
        </>
        );
    
  }
}

        export default Player;